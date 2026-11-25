import { safeHref } from "@/lib/content/links";
import { sourceDetails, type Source } from "@/lib/entity/format";

export function EntitySources({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  return (
    <section aria-labelledby="fontes-title" className="mt-16 border-t border-cold-white/10 pt-10">
      <h2 id="fontes-title" className="font-serif text-3xl font-semibold">
        Fontes
      </h2>
      <ol className="mt-6 list-decimal space-y-3 pl-6 text-sm leading-relaxed text-cold-white/80">
        {sources.map((source) => {
          const href = safeHref(source.url);
          const details = sourceDetails(source);
          return (
            <li key={source.id}>
              {source.author_or_institution && <>{source.author_or_institution}. </>}
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="italic underline decoration-gold/40 underline-offset-2 hover:decoration-gold"
                >
                  {source.title}
                </a>
              ) : (
                <cite>{source.title}</cite>
              )}
              {details && <>. {details}</>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
