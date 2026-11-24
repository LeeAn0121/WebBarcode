import { getCameraCaptureRegion } from "./cameraFrame";

/** Read the visible camera area without shrinking the fine bars of printed labels. */
export function startPrecisionScanner(
  video: HTMLVideoElement,
  onScan: (text: string) => void,
  onError: (error: string) => void,
): () => void {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("정밀 판독용 영상 버퍼를 만들지 못했습니다.");
  const worker = new Worker(new URL("./precision.worker.ts", import.meta.url), {
    type: "module",
  });
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;
  let watchdog: ReturnType<typeof setTimeout>;

  const stop = () => {
    stopped = true;
    clearTimeout(timer);
    clearTimeout(watchdog);
    worker.terminate();
    canvas.width = canvas.height = 0;
  };
  const fail = (error: string) => {
    stop();
    onError(error);
  };
  const capture = () => {
    if (stopped) return;
    if (
      !context ||
      video.readyState < 2 ||
      !video.videoWidth ||
      document.hidden
    ) {
      timer = setTimeout(capture, 250);
      return;
    }
    // Every frame includes the entire visible view at native resolution up to 4K.
    const bounds = video.getBoundingClientRect();
    const region = getCameraCaptureRegion(
      video.videoWidth,
      video.videoHeight,
      bounds.width,
      bounds.height,
    );
    if (!region) {
      timer = setTimeout(capture, 250);
      return;
    }
    const width = region.outputWidth;
    const height = region.outputHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    try {
      context.drawImage(
        video,
        region.x,
        region.y,
        region.width,
        region.height,
        0,
        0,
        width,
        height,
      );
      const frame = context.getImageData(0, 0, width, height);
      // Only one frame in flight. Slow devices never build up a decode queue.
      worker.postMessage(frame, [frame.data.buffer]);
      watchdog = setTimeout(() => fail("정밀 판독 응답 시간 초과"), 15000);
    } catch (error) {
      fail(String(error));
    }
  };
  worker.onmessage = ({
    data,
  }: MessageEvent<{ text?: string; error?: string }>) => {
    if (stopped) return;
    clearTimeout(watchdog);
    if (data.error) return fail(data.error);
    // Schedule before invoking the consumer so a callback cannot stall capture.
    timer = setTimeout(capture, 200);
    if (data.text) onScan(data.text);
  };
  worker.onerror = (event) => {
    event.preventDefault();
    fail(event.message);
  };
  capture();
  return stop;
}
