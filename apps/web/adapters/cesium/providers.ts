import {
  buildModuleUrl,
  CesiumTerrainProvider,
  createWorldImageryAsync,
  createWorldTerrainAsync,
  EllipsoidTerrainProvider,
  Ion,
  TileMapServiceImageryProvider,
  type ImageryProvider,
  type TerrainProvider,
} from "cesium";

import type { GlobeImagery, GlobeTerrain } from "@/domain/geography/globe";

const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;

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

export async function createTerrain(): Promise<{ provider: TerrainProvider; kind: GlobeTerrain }> {
  if (!isIonConfigured) {
    return { provider: new EllipsoidTerrainProvider(), kind: "flat" };
  }
  try {
    const provider: CesiumTerrainProvider = await createWorldTerrainAsync();
    return { provider, kind: "relief" };
  } catch (error) {
    console.warn("[globe] terreno indisponível, usando elipsoide", error);
    return { provider: new EllipsoidTerrainProvider(), kind: "flat" };
  }
}
