import { Cartesian3, type CesiumWidget } from "cesium";

const RADIANS_PER_SECOND = 0.025;
const RESUME_DELAY_MS = 3000;
const RESUME_RAMP_MS = 2000;
// Perto da superfície a rotação arrastaria o usuário para longe do lugar que ele está olhando.
const FULL_SPEED_HEIGHT_M = 10_000_000;
const STOPPED_HEIGHT_M = 3_000_000;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function startAutoRotation(widget: CesiumWidget): () => void {
  const { scene, canvas } = widget;
  let isInteracting = false;
  let lastInteractionAt = Number.NEGATIVE_INFINITY;
  let lastFrameAt = performance.now();

  const onPointerDown = () => {
    isInteracting = true;
  };
  const onInteractionEnd = () => {
    isInteracting = false;
    lastInteractionAt = performance.now();
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onInteractionEnd);
  canvas.addEventListener("pointercancel", onInteractionEnd);
  canvas.addEventListener("wheel", onInteractionEnd, { passive: true });

  const removePreRender = scene.preRender.addEventListener(() => {
    const now = performance.now();
    const elapsedSeconds = (now - lastFrameAt) / 1000;
    lastFrameAt = now;
    if (isInteracting) return;

    const idleMs = now - lastInteractionAt;
    const resumeFactor = clamp01((idleMs - RESUME_DELAY_MS) / RESUME_RAMP_MS);
    const height = scene.camera.positionCartographic.height;
    const heightFactor = clamp01((height - STOPPED_HEIGHT_M) / (FULL_SPEED_HEIGHT_M - STOPPED_HEIGHT_M));
    const angle = RADIANS_PER_SECOND * elapsedSeconds * resumeFactor * heightFactor;
    if (angle <= 0) return;

    // setView recalcula a orientação a cada frame; camera.rotate incremental acumula erro numérico
    // e leva o zoom do Cesium a normalizar um vetor nulo, o que interrompe a renderização.
    const { camera } = scene;
    const { longitude, latitude } = camera.positionCartographic;
    camera.setView({
      destination: Cartesian3.fromRadians(longitude - angle, latitude, height),
      orientation: { heading: camera.heading, pitch: camera.pitch, roll: camera.roll },
    });
  });

  return () => {
    removePreRender();
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointerup", onInteractionEnd);
    canvas.removeEventListener("pointercancel", onInteractionEnd);
    canvas.removeEventListener("wheel", onInteractionEnd);
  };
}
