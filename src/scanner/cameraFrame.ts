export interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  outputWidth: number;
  outputHeight: number;
}

/** Capture every visible pixel of centered object-fit: cover, including the edges. */
export function getCameraCaptureRegion(
  sourceWidth: number,
  sourceHeight: number,
  displayWidth: number,
  displayHeight: number,
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
  // Preserve native pixels through 4K. Larger sensors retain the entire view
  // within a bounded transfer buffer rather than cropping its edges away.
  const scale = Math.min(1, Math.sqrt(8_294_400 / (width * height)));
  return {
    x: Math.floor((sourceWidth - width) / 2),
    y: Math.floor((sourceHeight - height) / 2),
    width,
    height,
    outputWidth: Math.max(1, Math.round(width * scale)),
    outputHeight: Math.max(1, Math.round(height * scale)),
  };
}
