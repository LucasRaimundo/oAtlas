import type { ContentBlock } from "@/lib/api/entities";

import { TextRuns } from "./TextRuns";

type Quote = Extract<ContentBlock, { type: "quote" }>;

export function QuoteBlock({ block }: { block: Quote }) {
  return (
    <figure className="my-6 border-l-2 border-gold/60 pl-5">
      <blockquote className="italic leading-relaxed">
        <TextRuns runs={block.text} />
      </blockquote>
      {block.caption && <figcaption className="mt-2 text-sm text-cold-white/70">— {block.caption}</figcaption>}
    </figure>
  );
}
