import type { CesiumWidget } from "cesium";

const RECOVERY_WINDOW_MS = 10_000;
const MAX_RECOVERIES_IN_WINDOW = 3;

/**
 * O CesiumWidget interrompe o loop de renderização em qualquer erro de frame. Erros pontuais
 * (ex.: matemática degenerada do controle de câmera) não corrompem a cena, então retomamos;
 * erros em sequência indicam falha persistente e são repassados.
 */
export function recoverFromRenderErrors(widget: CesiumWidget, onPersistentFailure: (error: unknown) => void): () => void {
  let recentErrorTimes: number[] = [];

  return widget.scene.renderError.addEventListener((_scene: unknown, error: unknown) => {
    const now = performance.now();
    recentErrorTimes = [...recentErrorTimes.filter((time) => now - time < RECOVERY_WINDOW_MS), now];

    if (recentErrorTimes.length > MAX_RECOVERIES_IN_WINDOW) {
      console.error("[globe] erros de renderização persistentes", error);
      onPersistentFailure(error);
      return;
    }

    console.warn("[globe] erro de renderização, retomando", error);
    widget.useDefaultRenderLoop = true;
  });
}
