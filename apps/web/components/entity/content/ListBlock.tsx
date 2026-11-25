import type { ListBlock as ListBlockData, ListItem } from "@/lib/api/entities";

import { TextRuns } from "./TextRuns";

type ListStyle = ListBlockData["style"];

function List({ items, style }: { items: ListItem[]; style: ListStyle }) {
  const Tag = style === "ordered" ? "ol" : "ul";
  const marker = style === "ordered" ? "list-decimal" : "list-disc";
  return (
    <Tag className={`my-2 space-y-1 pl-6 ${marker}`}>
      {items.map((item, index) => (
        <li key={index} className="leading-relaxed">
          <TextRuns runs={item.text} />
          {/* A sublista fica dentro do li do pai, preservando a hierarquia, e herda o estilo do bloco. */}
          {item.items.length > 0 && <List items={item.items} style={style} />}
        </li>
      ))}
    </Tag>
  );
}

export function ListBlock({ block }: { block: ListBlockData }) {
  return (
    <div className="my-4">
      <List items={block.items} style={block.style} />
    </div>
  );
}
