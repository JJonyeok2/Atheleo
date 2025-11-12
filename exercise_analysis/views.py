# exercise_analysis/views.py
#여기는 기존 너 더미코드 확인해보고 교체해도 될듯 예시임
import base64
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from exercise_analysis.services.pushup_analysis_service import PushupAnalysisService

# 서버 기동 시 1회 로드 (reference 영상이 있다면 경로 지정)
# 없으면 reference_video_path=None 로 두면 간단 점수만 계산
SERVICE = PushupAnalysisService(reference_video_path="exercise_analysis/reference_pushup.mp4")

@csrf_exempt
def analyze_pushup(request):
    """
    POST /api/pushup/frame
    Body:
      - form-data file: "frame" (image/jpeg/png)  또는
      - JSON: {"image_base64": "data:image/jpeg;base64,...." 혹은 순수 base64 문자열}
    Return:
      {"ok": true, "angle": 142.3, "score": 87}
    """
    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "POST only"}, status=405)

    # 1) form-data로 파일 온 경우
    if 'frame' in request.FILES:
        data = request.FILES['frame'].read()
    else:
        # 2) JSON base64
        try:
            payload = request.body.decode('utf-8') if request.body else ""
        except Exception:
            payload = ""
        data = None
        if payload:
            import json
            try:
                obj = json.loads(payload)
                b64 = obj.get("image_base64", "")
                if b64.startswith("data:"):
                    # data URL 스킴 제거
                    b64 = b64.split(",", 1)[1]
                if b64:
                    data = base64.b64decode(b64)
            except Exception:
                pass

        if data is None:
            return JsonResponse({"ok": False, "error": "No image provided"}, status=400)

    result = SERVICE.process_frame(data)
    return JsonResponse(result, status=200 if result.get("ok") else 500)
