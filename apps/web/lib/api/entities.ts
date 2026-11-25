import { z } from "zod";

import {
  zEntityDetail,
  zGetEntityV1EntitiesSlugGetPath,
  zHeadingBlock,
  zListBlock,
  zParagraphBlock,
  zQuoteBlock,
  zSection,
  zTextRun,
} from "./generated/zod.gen";

const REQUEST_TIMEOUT_MS = 5_000;

export type TextRun = z.infer<typeof zTextRun>;

// O gerador tipa a recursão de ListItem como `any`; o Zod valida em runtime, este tipo devolve a checagem estática.
export type ListItem = { text: TextRun[]; items: ListItem[] };
export type ListBlock = Omit<z.infer<typeof zListBlock>, "items"> & { items: ListItem[] };
export type ContentBlock =
  | z.infer<typeof zHeadingBlock>
  | z.infer<typeof zParagraphBlock>
  | ListBlock
  | z.infer<typeof zQuoteBlock>;
export type Section = Omit<z.infer<typeof zSection>, "content"> & { content: ContentBlock[] };
export type Entity = Omit<z.infer<typeof zEntityDetail>, "sections"> & { sections: Section[] };

export type EntityLookup = { found: true; entity: Entity } | { found: false };

/** A API não respondeu a tempo, falhou ou não está configurada; tentar de novo pode resolver. */
export class EntityUnavailableError extends Error {
  override name = "EntityUnavailableError";
}

/** A API respondeu fora do contrato; tentar de novo não resolve. */
export class EntityContractError extends Error {
  override name = "EntityContractError";
}

// Seções são validadas uma a uma: uma seção fora do contrato some da página, as demais continuam (plano §2.1).
const zEntityWithLooseSections = zEntityDetail.extend({ sections: z.array(z.unknown()) });

type GetEntityOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  logError?: (message: string, details: Record<string, unknown>) => void;
};

export async function getEntity(slug: string, options: GetEntityOptions = {}): Promise<EntityLookup> {
  const {
    baseUrl = process.env.ORTELIUS_API_URL,
    fetchImpl = fetch,
    timeoutMs = REQUEST_TIMEOUT_MS,
    logError = (message, details) => console.error(message, details),
  } = options;

  if (!zGetEntityV1EntitiesSlugGetPath.safeParse({ slug }).success) return { found: false };
  if (!baseUrl) throw new EntityUnavailableError("ORTELIUS_API_URL não configurada");

  let response: Response;
  try {
    response = await fetchImpl(new URL(`/v1/entities/${slug}`, baseUrl), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new EntityUnavailableError(`API do ortelius sem resposta para ${slug}`, { cause: error });
  }

  if (response.status === 404) return { found: false };
  if (!response.ok) throw new EntityUnavailableError(`API do ortelius respondeu ${response.status} para ${slug}`);

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new EntityContractError(`resposta da API para ${slug} não é JSON`, { cause: error });
  }

  const parsed = zEntityWithLooseSections.safeParse(body);
  if (!parsed.success) {
    throw new EntityContractError(`entidade ${slug} fora do contrato: ${z.prettifyError(parsed.error)}`);
  }

  const sections: Section[] = [];
  for (const raw of parsed.data.sections) {
    const section = zSection.safeParse(raw);
    if (section.success) {
      sections.push(section.data);
    } else {
      logError("seção fora do contrato descartada", {
        slug,
        section_key: (raw as { section_key?: unknown } | null)?.section_key,
        issues: z.prettifyError(section.error),
      });
    }
  }
  return { found: true, entity: { ...parsed.data, sections } };
}
