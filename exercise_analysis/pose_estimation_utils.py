# exercise_analysis/pose_estimation_utils.py
import numpy as np
import tensorflow as tf

# 조인트 이름과 키포인트 인덱스를 매핑
KEYPOINT_DICT = {
    'nose': 0,
    'left_eye': 1,
    'right_eye': 2,
    'left_ear': 3,
    'right_ear': 4,
    'left_shoulder': 5,
    'right_shoulder': 6,
    'left_elbow': 7,
    'right_elbow': 8,
    'left_wrist': 9,
    'right_wrist': 10,
    'left_hip': 11,
    'right_hip': 12,
    'left_knee': 13,
    'right_knee': 14,
    'left_ankle': 15,
    'right_ankle': 16
}


# 신뢰도 임계값
MIN_CROP_KEYPOINT_SCORE = 0.2

def init_crop_region(image_height, image_width):
  if image_width > image_height:
    box_height = image_width / image_height
    box_width = 1.0
    y_min = (image_height / 2 - image_width / 2) / image_height
    x_min = 0.0
  else:
    box_height = 1.0
    box_width = image_height / image_width
    y_min = 0.0
    x_min = (image_width / 2 - image_height / 2) / image_width

  return {
    'y_min': y_min,
    'x_min': x_min,
    'y_max': y_min + box_height,
    'x_max': x_min + box_width,
    'height': box_height,
    'width': box_width
  }

def torso_visible(keypoints):
  return ((keypoints[0, 0, KEYPOINT_DICT['left_hip'], 2] > MIN_CROP_KEYPOINT_SCORE or
           keypoints[0, 0, KEYPOINT_DICT['right_hip'], 2] > MIN_CROP_KEYPOINT_SCORE) and
          (keypoints[0, 0, KEYPOINT_DICT['left_shoulder'], 2] > MIN_CROP_KEYPOINT_SCORE or
           keypoints[0, 0, KEYPOINT_DICT['right_shoulder'], 2] > MIN_CROP_KEYPOINT_SCORE))

def determine_torso_and_body_range(keypoints, target_keypoints, center_y, center_x):
  torso_joints = ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip']
  max_torso_yrange = 0.0
  max_torso_xrange = 0.0
  for joint in torso_joints:
    dist_y = abs(center_y - target_keypoints[joint][0])
    dist_x = abs(center_x - target_keypoints[joint][1])
    if dist_y > max_torso_yrange:
      max_torso_yrange = dist_y
    if dist_x > max_torso_xrange:
      max_torso_xrange = dist_x

  max_body_yrange = 0.0
  max_body_xrange = 0.0
  for joint in KEYPOINT_DICT.keys():
    if keypoints[0, 0, KEYPOINT_DICT[joint], 2] < MIN_CROP_KEYPOINT_SCORE:
      continue
    dist_y = abs(center_y - target_keypoints[joint][0])
    dist_x = abs(center_x - target_keypoints[joint][1])
    if dist_y > max_body_yrange:
      max_body_yrange = dist_y
    if dist_x > max_body_xrange:
      max_body_xrange = dist_x

  return [max_torso_yrange, max_torso_xrange, max_body_yrange, max_body_xrange]

def determine_crop_region(keypoints, image_height, image_width):
  target_keypoints = {}
  for joint in KEYPOINT_DICT.keys():
    target_keypoints[joint] = [
      keypoints[0, 0, KEYPOINT_DICT[joint], 0] * image_height,
      keypoints[0, 0, KEYPOINT_DICT[joint], 1] * image_width
    ]

  if torso_visible(keypoints):
    center_y = (target_keypoints['left_hip'][0] + target_keypoints['right_hip'][0]) / 2
    center_x = (target_keypoints['left_hip'][1] + target_keypoints['right_hip'][1]) / 2

    (max_torso_yrange, max_torso_xrange,
     max_body_yrange, max_body_xrange) = determine_torso_and_body_range(
        keypoints, target_keypoints, center_y, center_x)

    crop_length_half = np.amax([
      max_torso_xrange * 1.9, max_torso_yrange * 1.9,
      max_body_yrange * 1.2,  max_body_xrange * 1.2
    ])

    tmp = np.array([center_x, image_width - center_x, center_y, image_height - center_y])
    crop_length_half = np.amin([crop_length_half, np.amax(tmp)])

    crop_corner = [center_y - crop_length_half, center_x - crop_length_half]

    if crop_length_half > max(image_width, image_height) / 2:
      return init_crop_region(image_height, image_width)
    else:
      crop_length = crop_length_half * 2
      return {
        'y_min': crop_corner[0] / image_height,
        'x_min': crop_corner[1] / image_width,
        'y_max': (crop_corner[0] + crop_length) / image_height,
        'x_max': (crop_corner[1] + crop_length) / image_width,
        'height': (crop_corner[0] + crop_length) / image_height - crop_corner[0] / image_height,
        'width':  (crop_corner[1] + crop_length) / image_width  - crop_corner[1] / image_width
      }
  else:
    return init_crop_region(image_height, image_width)

def crop_and_resize(image, crop_region, crop_size):
  boxes = [[crop_region['y_min'], crop_region['x_min'],
            crop_region['y_max'], crop_region['x_max']]]
  output_image = tf.image.crop_and_resize(
      image, box_indices=[0], boxes=boxes, crop_size=crop_size)
  return output_image

def run_inference(movenet_fn, image, crop_region, crop_size):
  image_height, image_width, _ = image.shape
  input_image = crop_and_resize(tf.expand_dims(image, axis=0), crop_region, crop_size=crop_size)
  keypoints_with_scores = movenet_fn(input_image)
  # 모델 출력 좌표를 원본 이미지 좌표계로 보정
  for idx in range(17):
    keypoints_with_scores[0, 0, idx, 0] = (
        crop_region['y_min'] * image_height +
        crop_region['height']  * image_height *
        keypoints_with_scores[0, 0, idx, 0]) / image_height
    keypoints_with_scores[0, 0, idx, 1] = (
        crop_region['x_min'] * image_width  +
        crop_region['width']  * image_width  *
        keypoints_with_scores[0, 0, idx, 1]) / image_width
  return keypoints_with_scores

def calculate_angle(a, b, c):
  a = np.array(a); b = np.array(b); c = np.array(c)
  ba = a - b
  bc = c - b
  cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
  angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
  return np.degrees(angle)
