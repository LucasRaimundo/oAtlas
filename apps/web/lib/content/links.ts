const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

/** Devolve o link só se for absoluto e http(s); qualquer outro esquema (javascript:, data:, relativo) vira null. */
export function safeHref(href: string | null): string | null {
  if (!href || !URL.canParse(href)) return null;
  const url = new URL(href);
  return SAFE_PROTOCOLS.has(url.protocol) ? url.href : null;
}
