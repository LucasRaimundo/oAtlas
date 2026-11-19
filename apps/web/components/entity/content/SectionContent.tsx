import type { ContentBlock } from "@/lib/api/entities";

import { HeadingBlock } from "./HeadingBlock";
import { ListBlock } from "./ListBlock";
import { ParagraphBlock } from "./ParagraphBlock";
import { QuoteBlock } from "./QuoteBlock";

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading":
      return <HeadingBlock block={block} />;
    case "paragraph":
      return <ParagraphBlock block={block} />;
    case "list":
      return <ListBlock block={block} />;
    case "quote":
      return <QuoteBlock block={block} />;
    default: {
      // Um tipo novo no contrato quebra o typecheck aqui, em vez de sumir calado da página.
      const unhandled: never = block;
      return unhandled;
    }
  }
}

export function SectionContent({ blocks }: { blocks: ContentBlock[] }) {
  return blocks.map((block, index) => <Block key={index} block={block} />);
}
