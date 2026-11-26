import type { Entity } from "@/lib/api/entities";

export type Cover = NonNullable<Entity["cover"]>;

/** Prefixo público das imagens: o Next repassa `/midia/*` para `/v1/media/*` do ortelius (next.config.ts). */
export const MEDIA_PREFIX = "/midia/";
const API_MEDIA_PREFIX = "/v1/media/";

// Largura máxima pedida no celular: com densidade 3x, uma tela de 390 px pediria a versão de 1600 px, que
// passa de 200 KB em capas detalhadas (spec da capa, §5). 320 px × 3 = 960 px.
export const COVER_SIZES = "(max-width: 720px) 320px, 680px";

/** Caminho público de um tamanho; null se a API devolver algo fora do formato esperado. */
export function publicMediaPath(apiPath: string): string | null {
  if (!apiPath.startsWith(API_MEDIA_PREFIX)) return null;
  return MEDIA_PREFIX + apiPath.slice(API_MEDIA_PREFIX.length);
}

export type CoverSources = { src: string; srcSet: string };

/** `src` (o maior tamanho até 960 px, para navegadores sem srcset) e `srcset` com todos os tamanhos. */
export function coverSources(cover: Cover): CoverSources | null {
  const renditions = cover.renditions
    .map((rendition) => ({ width: rendition.width, path: publicMediaPath(rendition.path) }))
    .filter((rendition): rendition is { width: number; path: string } => rendition.path !== null)
    .toSorted((a, b) => a.width - b.width);
  if (renditions.length === 0) return null;

  const fallback = renditions.findLast((rendition) => rendition.width <= 960) ?? renditions[0];
  return {
    src: fallback.path,
    srcSet: renditions.map((rendition) => `${rendition.path} ${rendition.width}w`).join(", "),
  };
}

/** Maior tamanho disponível, para a imagem de compartilhamento. */
export function largestRendition(cover: Cover): { path: string; width: number } | null {
  const largest = cover.renditions.toSorted((a, b) => b.width - a.width)[0];
  const path = largest && publicMediaPath(largest.path);
  return path ? { path, width: largest.width } : null;
}
