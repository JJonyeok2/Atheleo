# exercise/views.py

import base64
import cv2
import numpy as np
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import mediapipe as mp
import traceback # For more detailed error logging

# --- Helper Functions ---

def decode_base64_image(base64_string):
    if "," in base64_string:
        base64_string = base64_string.split(',')[1]
    missing_padding = len(base64_string) % 4
    if missing_padding:
        base64_string += '=' * (4 - missing_padding)
    try:
        img_data = base64.b64decode(base64_string)
        np_arr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("cv2.imdecode returned None.")
        return img
    except Exception as e:
        raise ValueError(f"Failed to decode base64 image: {e}")

def get_pose_landmarks(image):
    mp_pose = mp.solutions.pose
    with mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5, model_complexity=2) as pose:
        results = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        if not results.pose_landmarks:
            return None
        return results.pose_landmarks.landmark

def get_angle_3d(a, b, c):
    a = np.array([a.x, a.y, a.z])
    b = np.array([b.x, b.y, b.z])
    c = np.array([c.x, c.y, c.z])
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

# --- Exercise Analysis Functions ---

def analyze_bicep_curl(landmarks):
    mp_pose = mp.solutions.pose
    shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value]
    wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]
    
    angle = get_angle_3d(shoulder, elbow, wrist)
    feedback = ""
    
    if angle > 160:
        feedback = "팔을 더 접어주세요."
    elif angle < 30:
        feedback = "팔을 너무 많이 접었습니다."
    else:
        feedback = "좋은 자세입니다!"

    # 팔꿈치 고정 피드백 (예시)
    if abs(shoulder.x - elbow.x) * 100 > 15: # x좌표 차이가 크면 팔꿈치가 흔들린다고 가정
         feedback += " 팔꿈치를 몸에 더 고정하세요."

    score = max(0, min(100, 100 - abs(90 - angle)))
    return {"score": round(score), "feedback": feedback.strip()}

def analyze_overhead_extension(landmarks):
    mp_pose = mp.solutions.pose
    shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value]
    wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]

    angle = get_angle_3d(shoulder, elbow, wrist)
    feedback = ""

    if angle < 90: # down stage
        feedback = "팔을 위로 펴주세요."
    elif angle > 160: # up stage
        feedback = "자세 좋습니다!"
    else:
        feedback = "팔을 끝까지 펴주세요."
        
    score = max(0, min(100, (angle - 90) / (160 - 90) * 100))
    return {"score": round(score), "feedback": feedback}

def analyze_shoulder_press(landmarks):
    mp_pose = mp.solutions.pose
    shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value]
    wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]

    angle = get_angle_3d(shoulder, elbow, wrist)
    feedback = ""

    # wrist.y < elbow.y : 손목이 팔꿈치보다 위에 있음 (정상)
    if wrist.y < elbow.y and angle > 160: # up stage
        feedback = "자세 좋습니다!"
    elif wrist.y >= elbow.y:
        feedback = "팔꿈치보다 손목을 더 높이 드세요."
    elif angle < 90: # down stage
        feedback = "팔을 위로 펴주세요."
    else:
        feedback = "팔을 끝까지 펴주세요."

    score = max(0, min(100, 100 - abs(170 - angle)))
    return {"score": round(score), "feedback": feedback}

def analyze_chest_press(landmarks):
    mp_pose = mp.solutions.pose
    left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    left_elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value]
    left_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]
    right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    right_elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value]
    right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]

    left_angle = get_angle_3d(left_shoulder, left_elbow, left_wrist)
    right_angle = get_angle_3d(right_shoulder, right_elbow, right_wrist)
    avg_angle = (left_angle + right_angle) / 2
    feedback = ""

    if avg_angle < 100: # down stage
        feedback = "팔을 앞으로 펴주세요."
    elif avg_angle > 160: # up stage
        feedback = "자세 좋습니다!"
    else:
        feedback = "팔을 끝까지 펴주세요."
        
    score = max(0, min(100, (avg_angle - 100) / (160 - 100) * 100))
    return {"score": round(score), "feedback": feedback}


# --- Main API Views ---

# Mapping exercise types to analysis functions
EXERCISE_ANALYZERS = {
    "BICEP_CURL": analyze_bicep_curl,
    "OVERHEAD_EXTENSION": analyze_overhead_extension,
    "SHOULDER_PRESS": analyze_shoulder_press,
    "CHEST_PRESS": analyze_chest_press,
}

@api_view(['POST'])
def analyze_exercise(request):
    base64_image = request.data.get('image')
    exercise_type = request.data.get('exercise_type')

    if not base64_image:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
    if not exercise_type or exercise_type not in EXERCISE_ANALYZERS:
        return Response({'error': f'Invalid or missing exercise_type. Available types: {list(EXERCISE_ANALYZERS.keys())}'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        image = decode_base64_image(base64_image)
        landmarks = get_pose_landmarks(image)
        
        if landmarks is None:
            return Response({
                'score': 0, 
                'feedback': '자세를 감지할 수 없습니다. 카메라 정면에 서주세요.'
            }, status=status.HTTP_200_OK)

        # Dispatch to the correct analyzer
        analysis_func = EXERCISE_ANALYZERS[exercise_type]
        result = analysis_func(landmarks)

        return Response(result, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response({'error': f"Image processing error: {e}"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        traceback.print_exc()
        return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def body_analysis(request):
    front_base64_image = request.data.get('front_image')
    side_base64_image = request.data.get('side_image')

    if not front_base64_image and not side_base64_image:
        return Response({'error': 'At least one image (front_image or side_image) must be provided'}, status=status.HTTP_400_BAD_REQUEST)

    front_landmarks = None
    side_landmarks = None

    try:
        if front_base64_image:
            front_image = decode_base64_image(front_base64_image)
            front_landmarks = get_pose_landmarks(front_image)
        
        if side_base64_image:
            side_image = decode_base64_image(side_base64_image)
            side_landmarks = get_pose_landmarks(side_image)

        analysis_results = analyze_body_posture(front_landmarks, side_landmarks)

        if not front_landmarks and not side_landmarks:
             return Response({
                'analysis': 'No pose detected in either image. Please ensure the person is fully visible.',
                'front_keypoints': [],
                'side_keypoints': []
            }, status=status.HTTP_200_OK)

        return Response(analysis_results, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response({'error': f"Image processing error: {e}"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        traceback.print_exc()
        return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def analyze_body_posture(front_landmarks, side_landmarks):
    analysis_results = {
        "front_view_analysis": {},
        "side_view_analysis": {},
        "front_keypoints": [],
        "side_keypoints": []
    }
    mp_pose = mp.solutions.pose

    if front_landmarks:
        left_shoulder = front_landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
        right_shoulder = front_landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
        shoulder_width = np.linalg.norm(np.array([left_shoulder.x, left_shoulder.y]) - np.array([right_shoulder.x, right_shoulder.y]))
        analysis_results["front_view_analysis"]["shoulder_width"] = round(shoulder_width, 4)

        left_hip = front_landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
        right_hip = front_landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]
        hip_width = np.linalg.norm(np.array([left_hip.x, left_hip.y]) - np.array([right_hip.x, right_hip.y]))
        analysis_results["front_view_analysis"]["hip_width"] = round(hip_width, 4)

        shoulder_diff_y = left_shoulder.y - right_shoulder.y
        if abs(shoulder_diff_y) > 0.02:
            analysis_results["front_view_analysis"]["shoulder_asymmetry"] = "Right shoulder lower" if shoulder_diff_y > 0 else "Left shoulder lower"
        else:
            analysis_results["front_view_analysis"]["shoulder_asymmetry"] = "Shoulders appear balanced"

        hip_diff_y = left_hip.y - right_hip.y
        if abs(hip_diff_y) > 0.02:
            analysis_results["front_view_analysis"]["pelvic_tilt_front"] = "Right hip lower" if hip_diff_y > 0 else "Left hip lower"
        else:
            analysis_results["front_view_analysis"]["pelvic_tilt_front"] = "Pelvis appears balanced (front view)"

        if shoulder_width > 0 and hip_width > 0:
            shoulder_hip_ratio = shoulder_width / hip_width
            if shoulder_hip_ratio > 1.1:
                analysis_results["front_view_analysis"]["body_shape"] = "Inverted Triangle (역삼각형)"
            elif shoulder_hip_ratio < 0.9:
                analysis_results["front_view_analysis"]["body_shape"] = "Triangle (삼각형)"
            else:
                analysis_results["front_view_analysis"]["body_shape"] = "Rectangle (직사각형)"
        
        for landmark in front_landmarks:
            analysis_results["front_keypoints"].append({"x": landmark.x, "y": landmark.y, "z": landmark.z, "visibility": landmark.visibility})
    else:
        analysis_results["front_view_analysis"]["error"] = "No pose detected in front image."

    if side_landmarks:
        try:
            ear = side_landmarks[mp_pose.PoseLandmark.LEFT_EAR.value]
            shoulder = side_landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
            hip = side_landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
            knee = side_landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value]
            ankle = side_landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]

            neck_angle = get_angle_3d(ear, shoulder, hip)
            analysis_results["side_view_analysis"]["neck_angle"] = round(neck_angle, 2)
            if neck_angle < 160:
                analysis_results["side_view_analysis"]["neck_posture"] = "Possible forward head posture (거북목)"
            elif neck_angle > 175:
                analysis_results["side_view_analysis"]["neck_posture"] = "Possible straight neck (일자목)"
            else:
                analysis_results["side_view_analysis"]["neck_posture"] = "Good neck posture"

            pelvic_angle = get_angle_3d(shoulder, hip, knee)
            analysis_results["side_view_analysis"]["pelvic_angle"] = round(pelvic_angle, 2)
            if pelvic_angle < 170:
                analysis_results["side_view_analysis"]["pelvic_tilt_side"] = "Possible anterior pelvic tilt (골반 전방 경사)"
            elif pelvic_angle > 185:
                analysis_results["side_view_analysis"]["pelvic_tilt_side"] = "Possible posterior pelvic tilt (골반 후방 경사)"
            else:
                analysis_results["side_view_analysis"]["pelvic_tilt_side"] = "Balanced pelvic posture (side view)"

            knee_angle = get_angle_3d(hip, knee, ankle)
            analysis_results["side_view_analysis"]["knee_angle"] = round(knee_angle, 2)
            if knee_angle > 178:
                analysis_results["side_view_analysis"]["knee_hyperextension"] = "Possible knee hyperextension (무릎 과신전)"
            else:
                analysis_results["side_view_analysis"]["knee_hyperextension"] = "Normal knee alignment"
        except (IndexError, KeyError):
            # This handles cases where not all landmarks are detected
            pass
        
        for landmark in side_landmarks:
            analysis_results["side_keypoints"].append({"x": landmark.x, "y": landmark.y, "z": landmark.z, "visibility": landmark.visibility})
    else:
        analysis_results["side_view_analysis"]["error"] = "No pose detected in side image."

    return analysis_results