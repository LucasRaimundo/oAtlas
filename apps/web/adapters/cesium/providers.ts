import {
  buildModuleUrl,
  createWorldImageryAsync,
  createWorldTerrainAsync,
  Ion,
  TileMapServiceImageryProvider,
  type CesiumWidget,
  type ImageryProvider,
} from "cesium";

import type { GlobeImagery, GlobeTerrain } from "@/domain/geography/globe";

const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;

// Vista de longe o relevo é imperceptível; carregá-lo na abertura só disputa banda com a imagem.
const TERRAIN_ACTIVATION_HEIGHT_M = 2_000_000;

export const isIonConfigured = Boolean(ionToken);

if (ionToken) {
  Ion.defaultAccessToken = ionToken;
}

export async function createFallbackImagery(): Promise<ImageryProvider> {
  return TileMapServiceImageryProvider.fromUrl(buildModuleUrl("Assets/Textures/NaturalEarthII"));
}

export async function createImagery(): Promise<{ provider: ImageryProvider; kind: GlobeImagery }> {
  if (!isIonConfigured) {
    return { provider: await createFallbackImagery(), kind: "fallback" };
  }
  try {
    return { provider: await createWorldImageryAsync(), kind: "satellite" };
  } catch (error) {
    console.warn("[globe] imagem de satélite indisponível, usando fallback", error);
    return { provider: await createFallbackImagery(), kind: "fallback" };
  }
}

export function initialTerrainStatus(): GlobeTerrain {
  return isIonConfigured ? "deferred" : "unavailable";
}

export function enableTerrainWhenClose(widget: CesiumWidget, onResult: (terrain: GlobeTerrain) => void): () => void {
  if (!isIonConfigured) return () => {};

  const { camera } = widget.scene;
  let isStopped = false;

  const removeCameraListener = camera.changed.addEventListener(() => {
    if (camera.positionCartographic.height > TERRAIN_ACTIVATION_HEIGHT_M) return;
    removeCameraListener();

    createWorldTerrainAsync()
      .then((provider) => {
        if (isStopped) return;
        widget.terrainProvider = provider;
        onResult("relief");
      })
      .catch((error) => {
        if (isStopped) return;
        console.warn("[globe] terreno indisponível, mantendo superfície lisa", error);
        onResult("unavailable");
      });
  });

  return () => {
    isStopped = true;
    removeCameraListener();
  };
}
