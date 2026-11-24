/** html5-qrcode.start() resolves before its internal video.play() settles. */
export async function waitForCameraPlayback(
  video: HTMLVideoElement,
): Promise<void> {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.paused) {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeout);
        video.removeEventListener("playing", onReady);
        video.removeEventListener("error", onError);
      };
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error("카메라 영상을 재생하지 못했습니다."));
      };
      const timeout = setTimeout(onError, 10000);
      video.addEventListener("playing", onReady, { once: true });
      video.addEventListener("error", onError, { once: true });
    });
  }
  // Give the library's play promise a chance to resolve before stop removes video.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}
