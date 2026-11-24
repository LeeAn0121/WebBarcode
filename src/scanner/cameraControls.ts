type CameraControls = MediaTrackConstraintSet & {
  zoom?: number;
  torch?: boolean;
  focusMode?: string;
};

const pendingControls = new WeakMap<MediaStreamTrack, Promise<void>>();

/** Serialize controls so one update cannot overwrite another with stale settings. */
export function setCameraControls(
  track: MediaStreamTrack,
  controls: CameraControls,
): Promise<void> {
  const previous = pendingControls.get(track) || Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(async () => {
      if (track.readyState === "ended")
        throw new Error("카메라가 종료되었습니다.");
      const constraints = track.getConstraints();
      const advanced = Object.assign(
        {},
        ...(constraints.advanced || []),
        controls,
      );
      await track.applyConstraints({ ...constraints, advanced: [advanced] });
    });
  pendingControls.set(track, next);
  const cleanup = () => {
    if (pendingControls.get(track) === next) pendingControls.delete(track);
  };
  void next.then(cleanup, cleanup);
  return next;
}
