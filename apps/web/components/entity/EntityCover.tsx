import { safeHref } from "@/lib/content/links";
import { COVER_SIZES, coverSources, type Cover } from "@/lib/entity/cover";

import { CoverFigure } from "./CoverFigure";

const linkClass = "underline decoration-gold/40 underline-offset-2 hover:decoration-gold";

/** Capa com legenda e crédito (autor · licença · página de origem), como as licenças exigem. */
export function EntityCover({ cover }: { cover: Cover }) {
  const sources = coverSources(cover);
  if (!sources) return null;

  const licenseHref = safeHref(cover.license.url);
  const sourceHref = safeHref(cover.source_url);
  return (
    <CoverFigure
      src={sources.src}
      srcSet={sources.srcSet}
      sizes={COVER_SIZES}
      alt={cover.alt_text}
      width={cover.width}
      height={cover.height}
    >
      <figcaption className="mt-3 text-sm leading-relaxed text-cold-white/70">
        <span>{cover.caption}</span>
        <span className="mt-1 block text-xs text-cold-white/60">
          {cover.author} ·{" "}
          {licenseHref ? (
            <a href={licenseHref} target="_blank" rel="noopener noreferrer license" className={linkClass}>
              {cover.license.label}
            </a>
          ) : (
            cover.license.label
          )}
          {sourceHref && (
            <>
              {" · "}
              <a href={sourceHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
                Fonte
              </a>
            </>
          )}
        </span>
      </figcaption>
    </CoverFigure>
  );
}
