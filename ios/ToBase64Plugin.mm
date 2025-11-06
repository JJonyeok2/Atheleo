// ios/Plugins/ToBase64Plugin.mm
#import <Foundation/Foundation.h>
#import <CoreImage/CoreImage.h>
#import <CoreMedia/CoreMedia.h>
#import <CoreVideo/CoreVideo.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/Frame.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

@interface ToBase64Plugin : FrameProcessorPlugin
@end

// ✅ 파일 로드(이미지 로더) 확인: 바이너리 로드 시 단 1회 호출
__attribute__((constructor))
static void ToBase64PluginFileLoaded(void) {
  NSLog(@"🔍 [ToBase64Plugin] FILE LOADED (constructor) - binary loaded & symbols ready");
}

@implementation ToBase64Plugin

// ✅ 플러그인 등록 확인: 런타임 클래스 로딩 시점에 1회 호출
+ (void)load {
  NSLog(@"🚀 [ToBase64Plugin] +load called - registering plugin name 'toBase64'");
  printf("🚀 [ToBase64Plugin] +load called - registering plugin name 'toBase64'\n"); // stdout에도 출력

  [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"toBase64"
                                        withInitializer:^FrameProcessorPlugin* (VisionCameraProxyHolder* proxy, NSDictionary* options) {
    NSLog(@"🧩 [ToBase64Plugin] Initializer invoked by registry");
    printf("🧩 [ToBase64Plugin] Initializer invoked by registry\n"); // stdout에도 출력
    return [[ToBase64Plugin alloc] initWithProxy:proxy withOptions:options];
  }];
}

// ✅ 실제 프레임 처리: 첫 프레임에만 1회 로그 + 이후는 조용히 동작
- (id)callback:(Frame*)frame withArguments:(NSDictionary*)arguments {
  static int callCount = 0;
  callCount++;
  BOOL verboseLogging = (callCount <= 10); // 첫 10번만 상세 로그
  
  if (verboseLogging) {
    NSLog(@"🎥 [ToBase64Plugin] callback() called #%d - frame processing started", callCount);
  }
  
  @autoreleasepool {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      NSLog(@"🎥 [ToBase64Plugin] ⭐ First callback() reached!");
    });

    // Step 1: Frame 검증
    if (!frame || !frame.buffer) {
      NSLog(@"❌ [ToBase64Plugin] Step 1 FAILED: Null frame or frame.buffer");
      return [NSNull null];
    }
    if (verboseLogging) {
      NSLog(@"✅ [ToBase64Plugin] Step 1 OK: Frame and buffer exist");
    }

    // Step 2: PixelBuffer 추출
    CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    if (!pixelBuffer) {
      NSLog(@"❌ [ToBase64Plugin] Step 2 FAILED: Null pixelBuffer");
      return [NSNull null];
    }
    if (verboseLogging) {
      size_t width = CVPixelBufferGetWidth(pixelBuffer);
      size_t height = CVPixelBufferGetHeight(pixelBuffer);
      NSLog(@"✅ [ToBase64Plugin] Step 2 OK: pixelBuffer extracted (width=%zu, height=%zu)", width, height);
    }

    // Step 3: Quality 파라미터 추출
    CGFloat quality = 0.6;
    NSNumber *q = arguments[@"quality"];
    if ([q isKindOfClass:[NSNumber class]]) {
      quality = MAX(0.0, MIN(1.0, q.floatValue));
    }
    if (verboseLogging) {
      NSLog(@"✅ [ToBase64Plugin] Step 3 OK: quality = %.2f", quality);
    }

    // Step 4: CIImage 생성
    CIImage *ciImage = [CIImage imageWithCVPixelBuffer:pixelBuffer];
    if (!ciImage) {
      NSLog(@"❌ [ToBase64Plugin] Step 4 FAILED: Failed to create CIImage");
      return [NSNull null];
    }
    if (verboseLogging) {
      NSLog(@"✅ [ToBase64Plugin] Step 4 OK: CIImage created");
    }

    // Step 5: CIContext 생성 (한 번만)
    static CIContext *context;
    static dispatch_once_t onceContext;
    dispatch_once(&onceContext, ^{
      context = [CIContext contextWithOptions:nil];
      NSLog(@"🛠️ [ToBase64Plugin] Step 5 OK: CIContext created (static)");
    });

    // Step 6: ColorSpace 생성
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    if (!colorSpace) {
      NSLog(@"❌ [ToBase64Plugin] Step 6 FAILED: Failed to create color space");
      return [NSNull null];
    }
    if (verboseLogging) {
      NSLog(@"✅ [ToBase64Plugin] Step 6 OK: ColorSpace created");
    }

    // Step 7: JPEG 인코딩
    NSDictionary *opts = @{ (id)kCGImageDestinationLossyCompressionQuality: @(quality) };
    NSData *jpegData = [context JPEGRepresentationOfImage:ciImage colorSpace:colorSpace options:opts];
    CGColorSpaceRelease(colorSpace);

    if (!jpegData || jpegData.length == 0) {
      NSLog(@"❌ [ToBase64Plugin] Step 7 FAILED: JPEG encoding failed - data length = %lu", (unsigned long)jpegData.length);
      return [NSNull null];
    }
    if (verboseLogging) {
      NSLog(@"✅ [ToBase64Plugin] Step 7 OK: JPEG encoded - data length = %lu bytes", (unsigned long)jpegData.length);
    }

    // Step 8: Base64 인코딩
    NSString *base64 = [jpegData base64EncodedStringWithOptions:0];
    if (!base64 || base64.length == 0) {
      NSLog(@"❌ [ToBase64Plugin] Step 8 FAILED: Base64 encoding failed - string length = %lu", (unsigned long)base64.length);
      return [NSNull null];
    }
    
    // 성공 로그
    if (verboseLogging || callCount <= 3) {
      NSLog(@"✅ [ToBase64Plugin] Step 8 OK: Base64 encoded - string length = %lu", (unsigned long)base64.length);
      NSLog(@"✅ [ToBase64Plugin] 🎉 SUCCESS: All steps completed! Returning base64 string.");
    }
    
    return base64;
  }
}

@end
