# exercise/views.py

import base64
import cv2
import numpy as np
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import mediapipe as mp
import traceback # For more detailed error logging

# base64 이미지를 OpenCV 이미지로 디코딩 (개선된 버전)
def decode_base64_image(base64_string):
    # 데이터 URI 스키마 제거 (예: "data:image/jpeg;base64,")
    if "," in base64_string:
        base64_string = base64_string.split(',')[1]
        
    # 패딩 추가
    missing_padding = len(base64_string) % 4
    if missing_padding:
        base64_string += '=' * (4 - missing_padding)
    
    try:
        img_data = base64.b64decode(base64_string)
        np_arr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("cv2.imdecode returned None. Image data may be corrupt.")
        return img
    except Exception as e:
        # 디코딩 실패 시 에러 발생
        raise ValueError(f"Failed to decode base64 image: {e}")


# Mediapipe로 관절 추출
def get_pose_landmarks(image):
    mp_pose = mp.solutions.pose
    # min_detection_confidence와 min_tracking_confidence를 조절하여 감지 감도 변경 가능
    with mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5) as pose:
        # Mediapipe는 RGB 이미지를 사용하므로 변환
        results = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        if not results.pose_landmarks:
            return None
        return results.pose_landmarks.landmark

# 이두 컬 예시: 팔꿈치 각도 계산
def calculate_elbow_angle(landmarks):
    # 랜드마크 인덱스는 Mediapipe Pose 문서를 참조
    # https://google.github.io/mediapipe/solutions/pose.html#pose-landmark-model-card
    left_shoulder = landmarks[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER.value]
    left_elbow = landmarks[mp.solutions.pose.PoseLandmark.LEFT_ELBOW.value]
    left_wrist = landmarks[mp.solutions.pose.PoseLandmark.LEFT_WRIST.value]

    # 3D 좌표를 사용하여 각도 계산 (더 정확할 수 있음)
    def get_angle(a, b, c):
        a = np.array([a.x, a.y, a.z])
        b = np.array([b.x, b.y, b.z])
        c = np.array([c.x, c.y, c.z])
        
        ba = a - b
        bc = c - b
        
        cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
        angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
        return np.degrees(angle)

    return get_angle(left_shoulder, left_elbow, left_wrist)

# 피드백 생성 함수
def generate_feedback(angle):
    # 각도에 따른 피드백 로직 (운동에 맞게 수정 필요)
    if angle < 40:
        return "팔꿈치를 너무 많이 접었습니다. 최고 수축 지점을 약간 넘었습니다."
    elif angle > 160:
        return "팔꿈치를 더 접어주세요. 이완 동작이 거의 끝까지 이루어졌습니다."
    elif 40 <= angle <= 80:
        return "좋은 수축입니다! 정점에서 잠시 멈춰보세요."
    else:
        return "좋은 자세입니다! 천천히 반복하세요."

# 실제 API 뷰 함수
@api_view(['POST'])
def exercise_score(request):
    base64_image = request.data.get('image')
    if not base64_image:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # 1. 이미지 디코딩
        image = decode_base64_image(base64_image)
        
        # 2. 자세 감지
        landmarks = get_pose_landmarks(image)
        if landmarks is None:
            return Response({
                'score': 0, 
                'feedback': '자세를 감지할 수 없습니다. 카메라 정면에 서주세요.'
            }, status=status.HTTP_200_OK) # 400 대신 200과 피드백으로 처리

        # 3. 각도 계산
        angle = calculate_elbow_angle(landmarks)
        
        # 4. 점수 및 피드백 생성
        # 90도에서 가장 멀수록 점수가 낮아지는 간단한 로직
        score = max(0, min(100, 100 - abs(90 - angle))) 
        feedback = generate_feedback(angle)

        return Response({'score': round(score), 'feedback': feedback}, status=status.HTTP_200_OK)

    except ValueError as e:
        # 이미지 디코딩 또는 처리 중 발생한 특정 오류
        return Response({'error': f"Image processing error: {e}"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        # 기타 서버 내부 오류
        traceback.print_exc() # 서버 로그에 전체 트레이스백 출력
        return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)