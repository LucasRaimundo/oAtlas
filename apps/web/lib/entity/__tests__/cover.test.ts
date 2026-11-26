import { describe, expect, it } from "vitest";

import { coverSources, largestRendition, publicMediaPath, type Cover } from "../cover";

const ID = "2fa858a8-298a-4dc6-b189-01289b870fe4";

function cover(widths: number[]): Cover {
  return {
    id: ID,
    alt_text: "Mosaico romano",
    caption: "Mosaico de Virgílio",
    author: "David Bjorgen",
    license: { code: "public_domain", label: "Domínio público", url: null },
    source_url: "https://commons.wikimedia.org/wiki/File:Virgil.jpg",
    width: 1785,
    height: 1731,
    renditions: widths.map((width) => ({ width, path: `/v1/media/${ID}/${width}.webp?v=abc` })),
  };
}

describe("publicMediaPath", () => {
  it("maps the API path to the public /midia prefix, keeping the version", () => {
    expect(publicMediaPath(`/v1/media/${ID}/960.webp?v=abc`)).toBe(`/midia/${ID}/960.webp?v=abc`);
  });

  it.each(["https://evil.example/x.webp", "/v1/entities/roma", "//evil.example/v1/media/x"])(
    "refuses a path outside the media route: %s",
    (path) => {
      expect(publicMediaPath(path)).toBeNull();
    },
  );
});

describe("coverSources", () => {
  it("lists every size in srcset and falls back to the largest up to 960 px", () => {
    expect(coverSources(cover([1600, 480, 960]))).toEqual({
      src: `/midia/${ID}/960.webp?v=abc`,
      srcSet: `/midia/${ID}/480.webp?v=abc 480w, /midia/${ID}/960.webp?v=abc 960w, /midia/${ID}/1600.webp?v=abc 1600w`,
    });
  });

  it("uses the only size of a small image", () => {
    expect(coverSources(cover([300]))?.src).toBe(`/midia/${ID}/300.webp?v=abc`);
  });

  it("gives up when no size is usable", () => {
    expect(coverSources(cover([]))).toBeNull();
  });
});

describe("largestRendition", () => {
  it("picks the biggest size for sharing", () => {
    expect(largestRendition(cover([480, 1600, 960]))).toEqual({ path: `/midia/${ID}/1600.webp?v=abc`, width: 1600 });
  });
});
