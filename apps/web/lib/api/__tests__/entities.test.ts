import { describe, expect, it, vi } from "vitest";

import { EntityContractError, EntityUnavailableError, getEntity } from "../entities";

const BASE_URL = "http://ortelius.test";

const run = (text: string) => ({ text, bold: false, italic: false, href: null });

function section(key: string, content: unknown[] = [{ type: "paragraph", text: [run("Texto.")] }]) {
  return { section_key: key, title: key, position: 1, content };
}

function entityBody(overrides: Record<string, unknown> = {}) {
  return {
    id: "6f1c",
    slug: "virgilio",
    name: "Virgílio",
    entity_type: "person",
    summary: "Poeta romano.",
    description: null,
    cover_media: null,
    location: { type: "Point", coordinates: [10.7914, 45.1564] },
    aliases: [],
    sections: [section("origem")],
    relations: [],
    sources: [],
    ...overrides,
  };
}

function respondingWith(response: Response | Promise<Response>) {
  return vi.fn<typeof fetch>(() => Promise.resolve(response));
}

const json = (body: unknown, status = 200) => Response.json(body, { status });

describe("getEntity", () => {
  it("keeps the valid sections and drops the one outside the contract, logging which", async () => {
    const logError = vi.fn();
    const broken = section("vida", [{ type: "image", url: "x.jpg" }]);
    const fetchImpl = respondingWith(json(entityBody({ sections: [section("origem"), broken, section("obras")] })));

    const lookup = await getEntity("virgilio", { baseUrl: BASE_URL, fetchImpl, logError });

    expect(lookup.found && lookup.entity.sections.map((s) => s.section_key)).toEqual(["origem", "obras"]);
    expect(logError).toHaveBeenCalledWith(
      "seção fora do contrato descartada",
      expect.objectContaining({ slug: "virgilio", section_key: "vida" }),
    );
  });

  it("validates nested list items at any depth", async () => {
    const nested = section("obras", [
      {
        type: "list",
        style: "unordered",
        items: [{ text: [run("Eneida")], items: [{ text: "sem trechos", items: [] }] }],
      },
    ]);
    const fetchImpl = respondingWith(json(entityBody({ sections: [nested] })));

    const lookup = await getEntity("virgilio", { baseUrl: BASE_URL, fetchImpl, logError: vi.fn() });

    expect(lookup.found && lookup.entity.sections).toEqual([]);
  });

  it("treats 404 as an entity that does not exist", async () => {
    const lookup = await getEntity("atlantida", { baseUrl: BASE_URL, fetchImpl: respondingWith(json({}, 404)) });

    expect(lookup).toEqual({ found: false });
  });

  it("does not call the API for a slug the API would never accept", async () => {
    const fetchImpl = respondingWith(json(entityBody()));

    const lookup = await getEntity("../health", { baseUrl: BASE_URL, fetchImpl });

    expect(lookup).toEqual({ found: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    ["a server error", () => respondingWith(json({ detail: "banco fora" }, 503))],
    ["a network failure", () => vi.fn<typeof fetch>(() => Promise.reject(new TypeError("fetch failed")))],
  ])("reports %s as unavailable", async (_, makeFetch) => {
    await expect(getEntity("virgilio", { baseUrl: BASE_URL, fetchImpl: makeFetch() })).rejects.toBeInstanceOf(
      EntityUnavailableError,
    );
  });

  it("gives up after the timeout instead of hanging the page", async () => {
    const neverAnswers = vi.fn<typeof fetch>(
      (_, init) =>
        new Promise((_, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason))),
    );

    await expect(
      getEntity("virgilio", { baseUrl: BASE_URL, fetchImpl: neverAnswers, timeoutMs: 20 }),
    ).rejects.toBeInstanceOf(EntityUnavailableError);
  });

  it("reports a missing API address as unavailable, not as a missing entity", async () => {
    await expect(getEntity("virgilio", { baseUrl: "", fetchImpl: respondingWith(json(entityBody())) })).rejects.toThrow(
      "ORTELIUS_API_URL",
    );
  });

  it.each([
    ["an entity without a name", json(entityBody({ name: undefined }))],
    ["a body that is not JSON", new Response("<html>proxy</html>", { status: 200 })],
  ])("rejects %s as a contract error", async (_, response) => {
    await expect(getEntity("virgilio", { baseUrl: BASE_URL, fetchImpl: respondingWith(response) })).rejects.toBeInstanceOf(
      EntityContractError,
    );
  });
});
