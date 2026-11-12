import "cesium/Build/Cesium/Widgets/widgets.css";

import { Cartesian3, CesiumWidget, Color, EllipsoidTerrainProvider, ImageryLayer, SkyBox, type TileProviderError } from "cesium";

import type { CreateGlobe, GlobeStatus } from "@/domain/geography/globe";

import { startAutoRotation } from "./autoRotation";
import { trackLoadMilestones } from "./loadMilestones";
import { recoverFromRenderErrors } from "./renderRecovery";
import { createFallbackImagery, createImagery, enableTerrainWhenClose, initialTerrainStatus } from "./providers";

const SPACE_BLACK = "#05070b";
// public/images/globe-poster-*.webp foi renderizado com esta câmera; mudar aqui exige gerar o poster de novo.
const INITIAL_VIEW = Cartesian3.fromDegrees(20, 30, 11_000_000);
const MIN_ZOOM_DISTANCE_M = 300;
const MAX_ZOOM_DISTANCE_M = 40_000_000;
const MAX_TILE_RETRIES = 2;
// Falhas isoladas de tile são normais; várias seguidas indicam cota estourada ou provedor fora.
const FAILED_TILES_BEFORE_FALLBACK = 5;

export const createCesiumGlobe: CreateGlobe = async (container, callbacks) => {
  const imagery = await createImagery();

  const widget = new CesiumWidget(container, {
    baseLayer: new ImageryLayer(imagery.provider),
    terrainProvider: new EllipsoidTerrainProvider(),
    skyBox: false,
    showRenderLoopErrors: false,
  });

  const { scene } = widget;
  scene.backgroundColor = Color.fromCssColorString(SPACE_BLACK);
  scene.camera.setView({ destination: INITIAL_VIEW });
  scene.screenSpaceCameraController.minimumZoomDistance = MIN_ZOOM_DISTANCE_M;
  scene.screenSpaceCameraController.maximumZoomDistance = MAX_ZOOM_DISTANCE_M;

  let isDestroyed = false;
  let status: GlobeStatus = { imagery: imagery.kind, terrain: initialTerrainStatus() };
  const updateStatus = (change: Partial<GlobeStatus>) => {
    status = { ...status, ...change };
    callbacks.onStatusChange(status);
  };
  callbacks.onStatusChange(status);

  let failedTiles = 0;
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
        widget.imageryLayers.remove(widget.imageryLayers.get(0), true);
        widget.imageryLayers.addImageryProvider(fallback, 0);
        updateStatus({ imagery: "fallback" });
      })
      .catch((fallbackError) => console.error("[globe] fallback de imagem também falhou", fallbackError));
  });

  const stopRenderRecovery = recoverFromRenderErrors(widget, callbacks.onFailure);
  const stopTerrainActivation = enableTerrainWhenClose(widget, (terrain) => updateStatus({ terrain }));

  let stopAutoRotation = () => {};
  const stopMilestones = trackLoadMilestones(widget, {
    onInteractive: callbacks.onInteractive,
    onSharp: (elapsedMs) => {
      // Estrelas e rotação só depois do globo nítido: não disputam banda com a imagem
      // e a rotação não desalinha o globo do poster durante o fade.
      scene.skyBox = SkyBox.createEarthSkyBox();
      stopAutoRotation = startAutoRotation(widget);
      callbacks.onSharp(elapsedMs);
    },
  });

  return {
    destroy() {
      isDestroyed = true;
      stopMilestones();
      stopRenderRecovery();
      stopTerrainActivation();
      stopAutoRotation();
      removeImageryErrorListener();
      widget.destroy();
    },
  };
};
