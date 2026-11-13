import type { CesiumWidget } from "cesium";

export const GLOBE_INTERACTIVE_MARK = "atlas:globe-interactive";
export const GLOBE_SHARP_MARK = "atlas:globe-sharp";

interface MilestoneListeners {
  onInteractive(elapsedSinceNavigationMs: number): void;
  onSharp(elapsedSinceNavigationMs: number): void;
}

function report(mark: string, listener: (elapsedSinceNavigationMs: number) => void) {
  performance.mark(mark);
  listener(performance.now());
}

/**
 * Interativo: primeiro frame depois que o primeiro tile carregou.
 * Nítido: primeiro frame depois que a fila inicial de tiles esvaziou.
 */
export function trackLoadMilestones(widget: CesiumWidget, listeners: MilestoneListeners): () => void {
  const { scene } = widget;
  let peakQueuedTiles = 0;
  let hasLoadedFirstTile = false;
  let hasDrainedQueue = false;
  let hasReportedInteractive = false;

  const removeProgressListener = scene.globe.tileLoadProgressEvent.addEventListener((queuedTiles: number) => {
    if (queuedTiles < peakQueuedTiles) hasLoadedFirstTile = true;
    if (queuedTiles === 0 && peakQueuedTiles > 0) hasDrainedQueue = true;
    peakQueuedTiles = Math.max(peakQueuedTiles, queuedTiles);
  });

  const removePostRenderListener = scene.postRender.addEventListener(() => {
    if (hasLoadedFirstTile && !hasReportedInteractive) {
      hasReportedInteractive = true;
      report(GLOBE_INTERACTIVE_MARK, listeners.onInteractive);
    }
    if (hasDrainedQueue) {
      stop();
      report(GLOBE_SHARP_MARK, listeners.onSharp);
    }
  });

  function stop() {
    removeProgressListener();
    removePostRenderListener();
  }

  return stop;
}
