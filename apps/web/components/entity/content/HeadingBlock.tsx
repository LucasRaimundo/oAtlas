import type { ContentBlock } from "@/lib/api/entities";

import { TextRuns } from "./TextRuns";

type Heading = Extract<ContentBlock, { type: "heading" }>;

// O h2 é o título da seção; dentro dela, o editor só usa os níveis 3 e 4.
export function HeadingBlock({ block }: { block: Heading }) {
  const Tag = block.level === 3 ? "h3" : "h4";
  const size = block.level === 3 ? "text-xl" : "text-lg";
  return (
    <Tag className={`mt-8 mb-3 font-semibold ${size}`}>
      <TextRuns runs={block.text} />
    </Tag>
  );
}
