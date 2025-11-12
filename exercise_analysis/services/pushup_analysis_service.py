# exercise_analysis/services/pushup_analysis_service.py
import io
import math
import cv2
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub
from fastdtw import fastdtw

from exercise_analysis.pose_estimation_utils import (
    KEYPOINT_DICT,
    MIN_CROP_KEYPOINT_SCORE,
    init_crop_region,
    determine_crop_region,
    run_inference,
    calculate_angle,
)

class PushupAnalysisService:
    """
    실시간 프레임 처리용 Service.
    - 서버 시작시 참조 영상에서 ref_angles를 미리 추출(옵션)
    - 프론트에서 오는 프레임(RGB ndarray or JPEG bytes)을 받아 바로 각도/점수 반환
    """
    def __init__(self, reference_video_path: str | None = None,
                 model_name: str = "movenet_thunder",
                 min_conf: float = 0.2):
        self.model_name = model_name
        self.input_size = 256 if "thunder" in model_name else 192
        self.min_conf = max(min_conf, MIN_CROP_KEYPOINT_SCORE)

        # TF-Hub SavedModel 로드
        if "movenet_lightning" in model_name:
            module = hub.load("https://tfhub.dev/google/movenet/singlepose/lightning/4")
            self.input_size = 192
        elif "movenet_thunder" in model_name:
            module = hub.load("https://tfhub.dev/google/movenet/singlepose/thunder/4")
            self.input_size = 256
        else:
            raise ValueError(f"Unsupported model name: {model_name}")

        # SavedModel signature 래퍼
        self._model = module.signatures['serving_default']

        def movenet_fn(input_image):
            input_image = tf.cast(input_image, dtype=tf.int32)
            outputs = self._model(input_image)
            return outputs['output_0'].numpy()

        self.movenet = movenet_fn

        # 실시간용 상태 (crop region, 프레임 크기)
        self._crop_region = None
        self._img_h = None
        self._img_w = None

        # 기준(레퍼런스) 각도 시퀀스
        self.ref_angles = None
        if reference_video_path:
            try:
                self.ref_angles = self._extract_angles_from_video(reference_video_path)
            except Exception as e:
                print(f"[WARN] Failed to load reference video: {e}")
                self.ref_angles = None

    # ---------- Public API ----------

    def reset_stream_state(self):
        """스트림 변경 시 호출: crop region 상태 초기화"""
        self._crop_region = None
        self._img_h = None
        self._img_w = None

    def process_frame(self, frame_rgb: np.ndarray | bytes) -> dict:
        """
        실시간 프레임 처리:
        - 입력: RGB ndarray(HxWx3) 또는 JPEG/PNG 바이트
        - 출력: {'angle': float|None, 'score': int|None, 'ok': bool}
        """
        # 입력 디코딩
        if isinstance(frame_rgb, (bytes, bytearray)):
            frame_rgb = self._decode_image_bytes(frame_rgb)

        if frame_rgb is None or frame_rgb.ndim != 3:
            return {"ok": False, "error": "Invalid frame", "angle": None, "score": None}

        h, w, _ = frame_rgb.shape

        # 첫 프레임: crop 상태 초기화
        if self._crop_region is None or self._img_h != h or self._img_w != w:
            self._img_h, self._img_w = h, w
            self._crop_region = init_crop_region(h, w)

        # 추론
        keypoints = run_inference(self.movenet, frame_rgb, self._crop_region, [self.input_size, self.input_size])

        # 다음 프레임을 위한 crop region 업데이트
        self._crop_region = determine_crop_region(keypoints, h, w)

        # 각도 계산 (오른쪽 팔꿈치)
        angle, valid = self._right_elbow_angle(keypoints, h, w)
        if angle is None:
            return {"ok": True, "angle": None, "score": None}

        # 점수 계산 (레퍼런스 있으면 DTW 기반, 없으면 가벼운 규칙)
        score = None
        if self.ref_angles is not None and len(self.ref_angles) > 0:
            score = self._score_with_reference(angle)
        else:
            # 간단 규칙 예: 팔꿈치 각도 60~170 범위 가중 (원하면 바꿔도 됨)
            score = self._simple_score(angle)

        return {"ok": True, "angle": float(angle), "score": int(score) if score is not None else None}

    # ---------- Internal helpers ----------

    def _decode_image_bytes(self, data: bytes) -> np.ndarray | None:
        arr = np.frombuffer(data, np.uint8)
        bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if bgr is None:
            return None
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

    def _right_elbow_angle(self, keypoints, h, w):
        rs = (keypoints[0, 0, KEYPOINT_DICT['right_shoulder'], 1] * w,
              keypoints[0, 0, KEYPOINT_DICT['right_shoulder'], 0] * h)
        re = (keypoints[0, 0, KEYPOINT_DICT['right_elbow'],   1] * w,
              keypoints[0, 0, KEYPOINT_DICT['right_elbow'],   0] * h)
        rw = (keypoints[0, 0, KEYPOINT_DICT['right_wrist'],   1] * w,
              keypoints[0, 0, KEYPOINT_DICT['right_wrist'],   0] * h)

        s_conf = keypoints[0, 0, KEYPOINT_DICT['right_shoulder'], 2]
        e_conf = keypoints[0, 0, KEYPOINT_DICT['right_elbow'], 2]
        w_conf = keypoints[0, 0, KEYPOINT_DICT['right_wrist'], 2]
        if min(s_conf, e_conf, w_conf) < self.min_conf:
            return None, False

        return calculate_angle(rs, re, rw), True

    def _simple_score(self, angle: float) -> int:
        """
        간단 score: 60~170도 범위를 100점 만점으로 선형 매핑 (범위 밖 페널티)
        """
        min_a, max_a = 60.0, 170.0
        if angle < min_a:
            return max(0, int(100 - (min_a - angle)))
        if angle > max_a:
            return max(0, int(100 - (angle - max_a)))
        # 범위 안: 중앙(115도)에서 가까울수록 점수 ↑
        center = (min_a + max_a) / 2.0  # 115
        dist = abs(angle - center)
        # dist==0 -> 100점, dist==55 -> 50점 정도 되게
        return int(max(50, 100 - dist))

    def _score_with_reference(self, current_angle: float, window: int = 45) -> int:
        """
        레퍼런스 각도 시퀀스(ref_angles)와 현재 angle의 작은 윈도우 DTW로 매 프레임 점수 환산.
        - 가벼운 계산을 위해: (ref의 최근 window, 현재 angle을 작은 버퍼로 쌓아 비교) 전략 가능
        여기서는 단일 angle vs ref 슬라이딩 윈도우 평균으로 근사.
        """
        if self.ref_angles is None or len(self.ref_angles) == 0:
            return self._simple_score(current_angle)

        clean_ref = self.ref_angles[~np.isnan(self.ref_angles)]
        if len(clean_ref) == 0:
            return self._simple_score(current_angle)

        # ref를 window 크기 블록 평균과 현재 angle 비교로 근사 점수 (DTW 경량 대체)
        # 실제로는 프론트에서 angle 히스토리를 보내주면 fastdtw(ref_window, user_window) 권장
        ref_chunk = clean_ref[:window] if len(clean_ref) >= window else clean_ref
        ref_mean = float(np.mean(ref_chunk))
        dist = abs(ref_mean - current_angle)  # L1 근사

        # 거리가 작을수록 높은 점수 (dist 0 -> 100, dist 40 -> 60, dist 80 -> 20 정도)
        score = int(max(0, min(100, 100 - (dist * 1.0))))
        return score

    def _extract_angles_from_video(self, video_path: str) -> np.ndarray:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise IOError(f"Cannot open reference video: {video_path}")

        angles = []
        # 해상도
        orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        crop_region = init_crop_region(orig_h, orig_w)

        while True:
            ret, frame_bgr = cap.read()
            if not ret:
                break
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

            kps = run_inference(self.movenet, frame_rgb, crop_region, [self.input_size, self.input_size])
            crop_region = determine_crop_region(kps, orig_h, orig_w)

            rs = (kps[0, 0, KEYPOINT_DICT['right_shoulder'], 1] * orig_w,
                  kps[0, 0, KEYPOINT_DICT['right_shoulder'], 0] * orig_h)
            re = (kps[0, 0, KEYPOINT_DICT['right_elbow'],   1] * orig_w,
                  kps[0, 0, KEYPOINT_DICT['right_elbow'],   0] * orig_h)
            rw = (kps[0, 0, KEYPOINT_DICT['right_wrist'],   1] * orig_w,
                  kps[0, 0, KEYPOINT_DICT['right_wrist'],   0] * orig_h)

            s_conf = kps[0, 0, KEYPOINT_DICT['right_shoulder'], 2]
            e_conf = kps[0, 0, KEYPOINT_DICT['right_elbow'], 2]
            w_conf = kps[0, 0, KEYPOINT_DICT['right_wrist'], 2]
            if min(s_conf, e_conf, w_conf) >= self.min_conf:
                angles.append(calculate_angle(rs, re, rw))
            else:
                angles.append(np.nan)

        cap.release()
        return np.array(angles, dtype=np.float32)
