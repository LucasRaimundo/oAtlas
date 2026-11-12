import "cesium/Build/Cesium/Widgets/widgets.css";

import { Cartesian3, CesiumWidget, Color, ImageryLayer, type TileProviderError } from "cesium";

import type { CreateGlobe, GlobeStatus } from "@/domain/geography/globe";

import { startAutoRotation } from "./autoRotation";
import { onGlobeFirstRender } from "./firstRender";
import { createFallbackImagery, createImagery, createTerrain } from "./providers";

const SPACE_BLACK = "#05070b";
const INITIAL_VIEW = Cartesian3.fromDegrees(20, 30, 11_000_000);
const MIN_ZOOM_DISTANCE_M = 300;
const MAX_ZOOM_DISTANCE_M = 40_000_000;
const MAX_TILE_RETRIES = 2;
// Falhas isoladas de tile são normais; várias seguidas indicam cota estourada ou provedor fora.
const FAILED_TILES_BEFORE_FALLBACK = 5;

export const createCesiumGlobe: CreateGlobe = async (container, callbacks) => {
  const [imagery, terrain] = await Promise.all([createImagery(), createTerrain()]);

  const widget = new CesiumWidget(container, {
    baseLayer: new ImageryLayer(imagery.provider),
    terrainProvider: terrain.provider,
  });

  const { scene } = widget;
  scene.backgroundColor = Color.fromCssColorString(SPACE_BLACK);
  scene.camera.setView({ destination: INITIAL_VIEW });
  scene.screenSpaceCameraController.minimumZoomDistance = MIN_ZOOM_DISTANCE_M;
  scene.screenSpaceCameraController.maximumZoomDistance = MAX_ZOOM_DISTANCE_M;

  let status: GlobeStatus = { imagery: imagery.kind, terrain: terrain.kind };
  callbacks.onStatusChange(status);

  let failedTiles = 0;
  let isDestroyed = false;
  const removeImageryErrorListener = imagery.provider.errorEvent.addEventListener((error: TileProviderError) => {
    if (error.timesRetried < MAX_TILE_RETRIES) {
      error.retry = true;
      return;
    }
    failedTiles += 1;
    if (failedTiles !== FAILED_TILES_BEFORE_FALLBACK || status.imagery === "fallback") return;

    console.warn("[globe] falhas repetidas na imagem de satélite, usando fallback", error.error);
    removeImageryErrorListener();
    createFallbackImagery()
      .then((fallback) => {
        if (isDestroyed) return;
        const baseLayer = widget.imageryLayers.get(0);
        widget.imageryLayers.remove(baseLayer, true);
        widget.imageryLayers.addImageryProvider(fallback, 0);
        status = { ...status, imagery: "fallback" };
        callbacks.onStatusChange(status);
      })
      .catch((fallbackError) => console.error("[globe] fallback de imagem também falhou", fallbackError));
  });

  const stopAutoRotation = startAutoRotation(widget);
  const stopFirstRenderListener = onGlobeFirstRender(widget, callbacks.onFirstRender);

  return {
    destroy() {
      isDestroyed = true;
      stopFirstRenderListener();
      stopAutoRotation();
      removeImageryErrorListener();
      widget.destroy();
    },
  };
};
