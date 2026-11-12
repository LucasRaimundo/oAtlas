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

async function loadGlobe(
  container: HTMLElement,
  onStatusChange: (status: GlobeStatus) => void,
  onSharp: () => void,
  onFailure: (error: unknown) => void,
): Promise<GlobeHandle> {
  if (!supportsWebGL()) throw new WebGLUnavailableError();
  window.CESIUM_BASE_URL = "/cesium/";
  const { createCesiumGlobe } = await import("@/adapters/cesium/createCesiumGlobe");
  return createCesiumGlobe(container, {
    onStatusChange,
    onInteractive: (elapsedMs) => console.info(`[globe] interativo em ${Math.round(elapsedMs)} ms`),
    onSharp: (elapsedMs) => {
      console.info(`[globe] nítido em ${Math.round(elapsedMs)} ms`);
      onSharp();
    },
    onFailure,
  });
}

function degradedNotice(status: GlobeStatus): string | null {
  if (status.imagery === "fallback") return "Imagem de satélite indisponível. Exibindo mapa simplificado.";
  if (status.terrain === "unavailable") return "Relevo indisponível no momento.";
  return null;
}

export function GlobeViewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ViewportState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [isPosterVisible, setIsPosterVisible] = useState(true);


  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let handle: GlobeHandle | null = null;
    let isCancelled = false;

    loadGlobe(
      container,
      (status) => {
        if (!isCancelled) setState({ kind: "ready", status });
      },
      () => {
        if (!isCancelled) setIsPosterVisible(false);
      },
      () => {
        if (!isCancelled) setState({ kind: "failed" });
      },
    )
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
    <div className="relative h-full w-full overflow-hidden bg-space-black">
      <div ref={containerRef} className="absolute inset-0" onPointerDown={() => setIsPosterVisible(false)} />

      {/* Renderizado com a mesma câmera do globo (adapters/cesium/createCesiumGlobe.ts). O Cesium usa o FOV
          na maior dimensão da tela, por isso o tamanho em vmax. Já otimizado em WebP; next/image não agrega. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/globe-poster-1024.webp"
        srcSet="/images/globe-poster-1024.webp 1024w, /images/globe-poster-1456.webp 1456w"
        sizes="71vmax"
        alt=""
        aria-hidden
        fetchPriority="high"
        decoding="async"
        className={`pointer-events-none absolute top-1/2 left-1/2 size-[71.09vmax] max-w-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 ${
          isPosterVisible || state.kind === "unsupported" || state.kind === "failed" ? "opacity-100" : "opacity-0"
        }`}
      />

      {notice && (
        <p className="absolute top-4 left-4 rounded border border-gold/30 bg-deep-blue/70 px-3 py-1.5 text-xs text-cold-white/80 backdrop-blur">
          {notice}
        </p>
      )}

      {state.kind === "unsupported" && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="max-w-sm rounded bg-deep-blue/85 px-4 py-3 text-sm text-cold-white/90 backdrop-blur">
            Seu navegador ou dispositivo não suporta WebGL, necessário para exibir o globo.
          </p>
        </div>
      )}

      {state.kind === "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="max-w-sm rounded bg-deep-blue/85 px-4 py-3 text-sm text-cold-white/90 backdrop-blur">Não foi possível carregar o globo.</p>
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
