"use client";

import { useEffect, useRef, useState } from "react";

import type { GlobeHandle, GlobeStatus } from "@/domain/geography/globe";

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

type ViewportState =
  | { kind: "loading" }
  | { kind: "ready"; status: GlobeStatus }
  | { kind: "unsupported" }
  | { kind: "failed" };

class WebGLUnavailableError extends Error {}

function supportsWebGL(): boolean {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
}

async function loadGlobe(container: HTMLElement, onStatusChange: (status: GlobeStatus) => void): Promise<GlobeHandle> {
  if (!supportsWebGL()) throw new WebGLUnavailableError();
  window.CESIUM_BASE_URL = "/cesium/";
  const { createCesiumGlobe } = await import("@/adapters/cesium/createCesiumGlobe");
  return createCesiumGlobe(container, {
    onStatusChange,
    onFirstRender: (elapsedMs) => console.info(`[globe] primeira renderização em ${Math.round(elapsedMs)} ms`),
  });
}

function degradedNotice(status: GlobeStatus): string | null {
  if (status.imagery === "fallback") return "Imagem de satélite indisponível. Exibindo mapa simplificado.";
  if (status.terrain === "flat") return "Relevo indisponível no momento.";
  return null;
}

export function GlobeViewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ViewportState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let handle: GlobeHandle | null = null;
    let isCancelled = false;

    loadGlobe(container, (status) => {
      if (!isCancelled) setState({ kind: "ready", status });
    })
      .then((created) => {
        if (isCancelled) created.destroy();
        else handle = created;
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        if (error instanceof WebGLUnavailableError) {
          setState({ kind: "unsupported" });
          return;
        }
        console.error("[globe] falha ao iniciar o globo", error);
        setState({ kind: "failed" });
      });

    return () => {
      isCancelled = true;
      handle?.destroy();
    };
  }, [attempt]);

  const notice = state.kind === "ready" ? degradedNotice(state.status) : null;

  return (
    <div className="relative h-full w-full bg-space-black">
      <div ref={containerRef} className="absolute inset-0" />

      {notice && (
        <p className="absolute top-4 left-4 rounded border border-gold/30 bg-deep-blue/70 px-3 py-1.5 text-xs text-cold-white/80 backdrop-blur">
          {notice}
        </p>
      )}

      {state.kind === "unsupported" && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="max-w-sm text-sm text-cold-white/80">
            Seu navegador ou dispositivo não suporta WebGL, necessário para exibir o globo.
          </p>
        </div>
      )}

      {state.kind === "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="max-w-sm text-sm text-cold-white/80">Não foi possível carregar o globo.</p>
          <button
            type="button"
            onClick={() => {
              setState({ kind: "loading" });
              setAttempt((value) => value + 1);
            }}
            className="rounded border border-gold/60 px-4 py-1.5 text-sm text-gold transition-colors hover:bg-gold/10"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
