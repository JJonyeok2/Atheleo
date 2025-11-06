// app/plugins/toBase64.js
// worklet 내부에서도 사용할 수 있도록 import는 유지
import { VisionCameraProxy } from 'react-native-vision-camera';

// Vision Camera v4에서는 initFrameProcessorPlugin을 사용해야 함
// 모듈 로드 시점에 플러그인 초기화 (worklet 밖에서)
const plugin = VisionCameraProxy.initFrameProcessorPlugin('toBase64');

// 디버깅: 플러그인 상태 확인
if (__DEV__) {
  console.log('[toBase64] Module loaded');
  console.log('[toBase64] VisionCameraProxy:', VisionCameraProxy ? 'OK' : 'NULL');
  console.log('[toBase64] initFrameProcessorPlugin exists:', typeof VisionCameraProxy?.initFrameProcessorPlugin);
  console.log('[toBase64] Plugin initialized:', plugin ? 'OK' : 'NULL');
  if (plugin == null) {
    console.error('[toBase64] ❌ Plugin is NULL! Check iOS native registration.');
  } else {
    console.log('[toBase64] Plugin object:', plugin);
    console.log('[toBase64] Plugin.call exists:', typeof plugin?.call);
  }
}

/**
 * VisionCamera v4 플러그인 래퍼
 * @param {Frame} frame - VisionCamera Frame
 * @param {{quality?: number}} options
 * @returns {string|null} base64 string or null
 */
// worklet 내부에서 호출 가능한 디버그 함수 (JS 스레드로 전달)
let debugLogFn = null;
let debugCount = 0;

export function setDebugLogFn(fn) {
  debugLogFn = fn;
  debugCount = 0; // 리셋
}

export function toBase64(frame, options = { quality: 0.6 }) {
  'worklet';
  
  // worklet 내부에서는 외부 변수에 접근 가능해야 하지만,
  // Vision Camera v4.2.0에서 plugin 객체가 제대로 공유되지 않을 수 있음
  try {
    // 방법 1: 외부에서 초기화한 plugin 객체 사용
    if (plugin != null && typeof plugin.call === 'function') {
      // 디버그: 플러그인 호출 전
      if (debugLogFn && debugCount < 5) {
        debugLogFn(`[toBase64] Calling plugin.call() - plugin exists: ${plugin != null}`);
        debugCount++;
      }
      
      // 플러그인 호출
      const result = plugin.call(frame, options);
      
      // 디버그: 플러그인 호출 후
      if (debugLogFn && debugCount <= 5) {
        debugLogFn(`[toBase64] plugin.call() result: type=${typeof result}, isNull=${result == null}, length=${result?.length || 0}`);
        debugCount++;
      }
      
      // NSNull 처리: iOS 네이티브에서 [NSNull null]을 반환하면
      // JavaScript에서 특정 객체로 전달될 수 있음
      if (result === null || result === undefined) {
        if (debugLogFn && debugCount <= 5) {
          debugLogFn(`[toBase64] ❌ Result is null/undefined`);
        }
        return null;
      }
      
      // NSNull 체크: [NSNull null]은 JavaScript에서 객체로 나타날 수 있음
      // @ts-ignore
      if (result && typeof result === 'object' && result.constructor && result.constructor.name === 'NSNull') {
        if (debugLogFn && debugCount <= 5) {
          debugLogFn(`[toBase64] ❌ Result is NSNull`);
        }
        return null;
      }
      
      // 문자열이 아닌 경우
      if (typeof result !== 'string') {
        if (debugLogFn && debugCount <= 5) {
          debugLogFn(`[toBase64] ❌ Result is not string: ${typeof result}`);
        }
        return null;
      }
      
      // 빈 문자열인 경우
      if (result.length === 0) {
        if (debugLogFn && debugCount <= 5) {
          debugLogFn(`[toBase64] ❌ Result is empty string`);
        }
        return null;
      }
      
      // 성공
      if (debugLogFn && debugCount <= 5) {
        debugLogFn(`[toBase64] ✅ Success: base64 length=${result.length}`);
      }
      
      return result;
    }
    
    // 방법 2: worklet 내부에서 플러그인 다시 가져오기
    if (debugLogFn && debugCount < 5) {
      debugLogFn(`[toBase64] Plugin not found, trying to re-initialize...`);
      debugCount++;
    }
    
    // @ts-ignore
    const workletPlugin = VisionCameraProxy?.initFrameProcessorPlugin?.('toBase64');
    
    if (workletPlugin != null && typeof workletPlugin.call === 'function') {
      const result = workletPlugin.call(frame, options);
      
      if (result === null || result === undefined) {
        return null;
      }
      
      // @ts-ignore
      if (result && typeof result === 'object' && result.constructor && result.constructor.name === 'NSNull') {
        return null;
      }
      
      if (typeof result !== 'string') {
        return null;
      }
      
      if (result.length === 0) {
        return null;
      }
      
      return result;
    }
    
    // 플러그인을 찾을 수 없음
    if (debugLogFn && debugCount < 5) {
      debugLogFn(`[toBase64] ❌ Plugin not found (both methods failed)`);
      debugCount++;
    }
    return null;
  } catch (e) {
    // 에러 발생 시 null 반환
    if (debugLogFn && debugCount < 5) {
      debugLogFn(`[toBase64] ❌ Exception: ${e.message || e}`);
      debugCount++;
    }
    return null;
  }
}

/** 플러그인 사용 가능 여부 */
export function isToBase64Available() {
  'worklet';
  return plugin != null;
}
