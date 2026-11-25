import { Fragment, type ReactNode } from "react";

import type { TextRun } from "@/lib/api/entities";
import { safeHref } from "@/lib/content/links";

// O texto entra sempre como filho do React (escapado); nunca há HTML vindo da API.
function renderRun(run: TextRun): ReactNode {
  let node: ReactNode = run.text;
  if (run.italic) node = <em>{node}</em>;
  if (run.bold) node = <strong>{node}</strong>;

  const href = safeHref(run.href);
  if (!href) return node;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-gold/60 underline-offset-2 hover:decoration-gold"
    >
      {node}
    </a>
  );
}

export function TextRuns({ runs }: { runs: TextRun[] }) {
  // Trechos não têm id e a lista é estática: o índice basta como chave.
  return runs.map((run, index) => <Fragment key={index}>{renderRun(run)}</Fragment>);
}
