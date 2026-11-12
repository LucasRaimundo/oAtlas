import type { CesiumWidget } from "cesium";

export const GLOBE_FIRST_RENDER_MARK = "atlas:globe-first-render";

export function onGlobeFirstRender(widget: CesiumWidget, listener: (elapsedSinceNavigationMs: number) => void): () => void {
  let hasStartedLoading = false;

  const remove = widget.scene.globe.tileLoadProgressEvent.addEventListener((queuedTiles: number) => {
    if (queuedTiles > 0) {
      hasStartedLoading = true;
      return;
    }
    if (!hasStartedLoading) return;

    remove();
    performance.mark(GLOBE_FIRST_RENDER_MARK);
    listener(performance.now());
  });

  return remove;
}
