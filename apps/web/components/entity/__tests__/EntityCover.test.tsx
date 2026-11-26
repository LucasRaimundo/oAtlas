import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { Cover } from "@/lib/entity/cover";

import { EntityCover } from "../EntityCover";

const ID = "5a7b34ad-b792-4284-bc5b-47408f9e5533";

function cover(overrides: Partial<Cover> = {}): Cover {
  return {
    id: ID,
    alt_text: "Estátua de um guerreiro gaulês sobre um pedestal",
    caption: "Estátua de Vercingetórix por Aimé Millet",
    author: "Myrabella",
    license: { code: "cc_by_sa", label: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" },
    source_url: "https://commons.wikimedia.org/wiki/File:Alise.jpg",
    width: 1920,
    height: 3413,
    renditions: [480, 960, 1600].map((width) => ({ width, path: `/v1/media/${ID}/${width}.webp?v=1` })),
    ...overrides,
  };
}

describe("EntityCover", () => {
  it("renders the image with alt text, dimensions and responsive sources", () => {
    const html = renderToStaticMarkup(<EntityCover cover={cover()} />);

    expect(html).toContain('alt="Estátua de um guerreiro gaulês sobre um pedestal"');
    expect(html).toContain('width="1920"');
    expect(html).toContain('height="3413"');
    expect(html).toContain(`src="/midia/${ID}/960.webp?v=1"`);
    expect(html).toContain('sizes="(max-width: 720px) 320px, 680px"');
  });

  it("credits author, license with its link and the source page", () => {
    const html = renderToStaticMarkup(<EntityCover cover={cover()} />);

    expect(html).toContain("Estátua de Vercingetórix por Aimé Millet");
    expect(html).toContain("Myrabella");
    expect(html).toMatch(/<a href="https:\/\/creativecommons.org\/licenses\/by-sa\/4.0\/"[^>]*rel="noopener noreferrer license"[^>]*>CC BY-SA 4.0<\/a>/);
    expect(html).toMatch(/<a href="https:\/\/commons.wikimedia.org\/wiki\/File:Alise.jpg"[^>]*>Fonte<\/a>/);
  });

  it("shows public domain as plain text, without a license link", () => {
    const html = renderToStaticMarkup(
      <EntityCover cover={cover({ license: { code: "public_domain", label: "Domínio público", url: null } })} />,
    );

    expect(html).toContain("Domínio público");
    expect(html).not.toContain("creativecommons");
  });

  it("drops a source link that is not http(s)", () => {
    const html = renderToStaticMarkup(<EntityCover cover={cover({ source_url: "javascript:alert(1)" })} />);

    expect(html).not.toContain("javascript:");
    expect(html).not.toContain(">Fonte<");
  });

  it("renders nothing when the API sends no usable size", () => {
    expect(renderToStaticMarkup(<EntityCover cover={cover({ renditions: [] })} />)).toBe("");
  });
});
