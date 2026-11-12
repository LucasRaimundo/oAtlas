export type GlobeImagery = "satellite" | "fallback";
export type GlobeTerrain = "relief" | "flat";

export interface GlobeStatus {
  imagery: GlobeImagery;
  terrain: GlobeTerrain;
}

export interface GlobeCallbacks {
  onStatusChange(status: GlobeStatus): void;
  onFirstRender(elapsedSinceNavigationMs: number): void;
}

export interface GlobeHandle {
  destroy(): void;
}

export type CreateGlobe = (container: HTMLElement, callbacks: GlobeCallbacks) => Promise<GlobeHandle>;
