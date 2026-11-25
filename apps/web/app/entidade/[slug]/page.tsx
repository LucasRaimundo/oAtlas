import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EntityHeader } from "@/components/entity/EntityHeader";
import { EntityRelations } from "@/components/entity/EntityRelations";
import { EntitySections } from "@/components/entity/EntitySections";
import { EntitySkeleton } from "@/components/entity/EntitySkeleton";
import { EntitySources } from "@/components/entity/EntitySources";
import { getEntityCached } from "@/lib/api/cached-entities";

export async function generateMetadata({ params }: PageProps<"/entidade/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lookup = await getEntityCached(slug);
  if (!lookup.found) return { title: "Entidade não encontrada · Atlas" };
  return { title: `${lookup.entity.name} · Atlas`, description: lookup.entity.summary ?? undefined };
}

async function EntityArticle({ params }: Pick<PageProps<"/entidade/[slug]">, "params">) {
  const { slug } = await params;
  const lookup = await getEntityCached(slug);
  if (!lookup.found) notFound();

  const { entity } = lookup;
  return (
    <article className="mt-10">
      <EntityHeader entity={entity} />
      <EntitySections sections={entity.sections} />
      <EntityRelations relations={entity.relations} />
      <EntitySources sources={entity.sources} />
    </article>
  );
}

// Sem generateStaticParams: o build não depende da API. O slug só é lido dentro do Suspense, então a casca
// (moldura e esqueleto) é estática e o conteúdo chega por streaming. Custo: slug inexistente responde 200 com
// noindex, não 404, porque o streaming já começou.
export default function EntityPage({ params }: PageProps<"/entidade/[slug]">) {
  return (
    <Suspense fallback={<EntitySkeleton />}>
      <EntityArticle params={params} />
    </Suspense>
  );
}
