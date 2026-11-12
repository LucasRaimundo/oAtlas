export type GlobeImagery = "satellite" | "fallback";
export type GlobeTerrain = "deferred" | "relief" | "unavailable";

export interface GlobeStatus {
  imagery: GlobeImagery;
  terrain: GlobeTerrain;
}

export interface GlobeCallbacks {
  onStatusChange(status: GlobeStatus): void;
  onInteractive(elapsedSinceNavigationMs: number): void;
  onSharp(elapsedSinceNavigationMs: number): void;
}

export interface GlobeHandle {
  destroy(): void;
}

export type CreateGlobe = (container: HTMLElement, callbacks: GlobeCallbacks) => Promise<GlobeHandle>;
