import type { ContentBlock } from "@/lib/api/entities";

import { TextRuns } from "./TextRuns";

type Paragraph = Extract<ContentBlock, { type: "paragraph" }>;

export function ParagraphBlock({ block }: { block: Paragraph }) {
  return (
    <p className="my-4 leading-relaxed">
      <TextRuns runs={block.text} />
    </p>
  );
}
