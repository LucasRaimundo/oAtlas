import { cacheLife } from "next/cache";

import { getEntity } from "./entities";

/**
 * Entidade com cache de 60 s: o que for publicado no painel aparece em até um minuto.
 * Página e metadados usam a mesma função, então há uma chamada à API por slug.
 * Erros (API fora, resposta fora do contrato) não preenchem o cache: a próxima visita tenta de novo.
 */
export async function getEntityCached(slug: string) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  return getEntity(slug);
}
