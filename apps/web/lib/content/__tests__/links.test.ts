import { describe, expect, it } from "vitest";

import { safeHref } from "../links";

describe("safeHref", () => {
  it.each(["https://pt.wikipedia.org/wiki/Virg%C3%ADlio", "http://example.org/a?b=1"])("keeps %s", (href) => {
    expect(safeHref(href)).toBe(href);
  });

  it.each([
    "javascript:alert(1)",
    " JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "mailto:a@b.c",
    "/entidade/virgilio",
    "//evil.example",
    "nem um link",
    "",
    null,
  ])("rejects %j", (href) => {
    expect(safeHref(href)).toBeNull();
  });
});
