export interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  outputWidth: number;
  outputHeight: number;
}

/** Mirror centered object-fit: cover, then preserve native label pixels in a bounded ROI. */
export function getCameraCaptureRegion(
  sourceWidth: number,
  sourceHeight: number,
  displayWidth: number,
  displayHeight: number,
  fullView = false,
): CaptureRegion | null {
  if (
    ![sourceWidth, sourceHeight].every(
      (value) => Number.isFinite(value) && value >= 1,
    )
  )
    return null;
  let width = sourceWidth;
  let height = sourceHeight;
  if (
    displayWidth > 0 &&
    displayHeight > 0 &&
    Number.isFinite(displayWidth + displayHeight)
  ) {
    const coverScale = Math.max(
      displayWidth / sourceWidth,
      displayHeight / sourceHeight,
    );
    width = Math.min(
      sourceWidth,
      Math.max(1, Math.floor(displayWidth / coverScale)),
    );
    height = Math.min(
      sourceHeight,
      Math.max(1, Math.floor(displayHeight / coverScale)),
    );
  }
  if (!fullView) {
    width = Math.min(width, 2560);
    height = Math.min(height, Math.max(1, Math.floor(1_800_000 / width)));
  }
  const scale = fullView ? Math.min(1, 1920 / Math.max(width, height)) : 1;
  return {
    x: Math.floor((sourceWidth - width) / 2),
    y: Math.floor((sourceHeight - height) / 2),
    width,
    height,
    outputWidth: Math.max(1, Math.round(width * scale)),
    outputHeight: Math.max(1, Math.round(height * scale)),
  };
}
