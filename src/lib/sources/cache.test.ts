// @vitest-environment node
// Use Next's real cache/revalidation logic with isolated in-memory storage and upstream fixtures.
import "next/dist/server/node-environment-baseline";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  CacheHandler,
  IncrementalCache,
  type CacheHandlerValue
} from "next/dist/server/lib/incremental-cache";
import type { IncrementalCacheValue } from "next/dist/server/response-cache";
import { workAsyncStorage } from "next/dist/server/app-render/work-async-storage.external";
import { createWorkStore } from "next/dist/server/async-storage/work-store";
import { GET as newsGET } from "@/app/api/news/route";
import { GET as eventsGET } from "@/app/api/events/route";
import { GET as weatherGET } from "@/app/api/weather/route";
import { GET as beachesGET } from "@/app/api/beaches/route";
import { getEvents } from "@/lib/sources/events";
import { getBeachStatuses } from "@/lib/sources/beaches";
import { sourceResponseHeaders } from "@/lib/sources/cache";

const entries = new Map<string, CacheHandlerValue>();
class MemoryCache extends CacheHandler {
  async get(key: string) {
    return entries.get(key) ?? null;
  }
  async set(key: string, value: IncrementalCacheValue | null) {
    entries.set(key, { value, lastModified: Date.now() });
  }
}

let cache: IncrementalCache;
const fetchMock = vi.fn<typeof fetch>();

async function request<T>(callback: () => Promise<T>) {
  const store = createWorkStore({
    page: "/api/test/route",
    buildId: "test",
    deploymentId: "test",
    previouslyRevalidatedTags: [],
    renderOpts: {
      incrementalCache: cache,
      supportsDynamicResponse: true,
      cacheComponents: false,
      waitUntil: undefined,
      onClose: vi.fn(),
      onAfterTaskError: undefined,
      experimental: { authInterrupts: false }
    }
  });
  const result = await workAsyncStorage.run(store, callback);
  await Promise.all(Object.values(store.pendingRevalidates ?? {}));
  return result;
}

const newsHtml = '<a href="/ca/noticia"><h2>Una notícia de Badalona</h2></a>';
const agendaHtml = `
  <article><time>18 de juny</time> <h3><a href="/juny">Concert al passeig</a></h3></article>
  <article><time>18 de juliol</time> <h3><a href="/juliol">Concert d'estiu</a></h3></article>`;
const scenarios: Array<{
  name: string;
  get: () => Promise<Response>;
  body: string;
  seconds: number;
  fetches: number;
}> = [
  { name: "news", get: newsGET, body: newsHtml, seconds: 900, fetches: 1 },
  {
    name: "events",
    get: () => eventsGET(new NextRequest("http://localhost/api/events?month=2026-06")),
    body: agendaHtml,
    seconds: 3600,
    fetches: 2
  },
  {
    name: "weather",
    get: weatherGET,
    body: JSON.stringify({ today: { min_temp: "18", max_temp: "24" } }),
    seconds: 1800,
    fetches: 1
  },
  {
    name: "beaches",
    get: beachesGET,
    body: JSON.stringify({ beaches: [{ nom: "Platja del Cristall" }] }),
    seconds: 1200,
    fetches: 1
  }
];

beforeEach(() => {
  entries.clear();
  fetchMock.mockReset();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  // Next's cache age uses performance, while source timestamps use Date.
  vi.spyOn(performance, "now").mockImplementation(() => Date.now() - performance.timeOrigin);
  vi.stubGlobal("fetch", fetchMock);
  cache = new IncrementalCache({
    dev: false,
    requestHeaders: {},
    CurCacheHandler: MemoryCache,
    getPrerenderManifest: () => ({
      version: 4,
      routes: {},
      dynamicRoutes: {},
      notFoundRoutes: [],
      preview: { previewModeId: "test", previewModeSigningKey: "", previewModeEncryptionKey: "" }
    })
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe.each(scenarios)("$name caching", ({ get, body, seconds, fetches }) => {
  it("reuses parsed data and shares only the remaining freshness window", async () => {
    fetchMock.mockImplementation(async () => new Response(body));
    const first = await request(get);
    const firstBody = await first.json();
    expect(first.headers.get("cache-control")).toBe(
      `public, max-age=0, s-maxage=${seconds}, must-revalidate`
    );
    expect(first.headers.get("x-source-health")).toBe("fresh");
    expect(first.headers.get("x-source-url")).toMatch(/^https:/);

    vi.setSystemTime(Date.now() + 60_000);
    const second = await request(get);
    expect(await second.json()).toEqual(firstBody);
    expect(fetchMock).toHaveBeenCalledTimes(fetches);
    expect(second.headers.get("cache-control")).toBe(
      `public, max-age=0, s-maxage=${seconds - 60}, must-revalidate`
    );
    for (const [, options] of fetchMock.mock.calls) {
      expect(options).toMatchObject({ cache: "no-store" });
      expect(options).not.toHaveProperty("next.revalidate");
    }
    expect(entries.size).toBe(1);
    const value = [...entries.values()][0].value;
    expect(value?.kind).toBe("FETCH");
    if (value?.kind === "FETCH") {
      expect(value.revalidate).toBe(seconds);
      expect(value.data.body).not.toContain("<h");
    }
  });

  it.each(["http", "network"])("does not cache a %s error fallback and retries immediately", async (failure) => {
    if (failure === "http") {
      fetchMock.mockImplementation(async () => new Response("Unavailable", { status: 503 }));
    } else {
      fetchMock.mockRejectedValue(new Error("Offline"));
    }
    const failed = await request(get);
    expect(failed.headers.get("x-source-health")).toBe("error");
    expect(failed.headers.get("cache-control")).toBe("no-store");
    expect(entries.size).toBe(0);

    fetchMock.mockImplementation(async () => new Response(body));
    const recovered = await request(get);
    expect(recovered.headers.get("x-source-health")).toBe("fresh");
    expect(fetchMock).toHaveBeenCalledTimes(fetches * 2);
    expect(entries.size).toBe(1);
  });

  it("keeps the last good value during failed revalidation without sharing it as fresh", async () => {
    fetchMock.mockImplementation(async () => new Response(body));
    const original = await (await request(get)).json();
    const cached = JSON.stringify([...entries.values()]);
    vi.setSystemTime(Date.now() + (seconds + 1) * 1000);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockImplementation(async () => new Response("Unavailable", { status: 503 }));

    const stale = await request(get);
    expect(await stale.json()).toEqual(original);
    expect(stale.headers.get("x-source-health")).toBe("stale");
    expect(stale.headers.get("cache-control")).toBe("no-store");
    expect(JSON.stringify([...entries.values()])).toBe(cached);
    expect(log).toHaveBeenCalled();

    fetchMock.mockImplementation(async () => new Response(body));
    await request(get); // Triggers the next background refresh.
    const fresh = await request(get);
    expect(fresh.headers.get("x-source-health")).toBe("fresh");
    expect(fresh.headers.get("cache-control")).toContain(`s-maxage=${seconds}`);
    expect(fetchMock).toHaveBeenCalledTimes(fetches * 3);
  });
});

it("shares agenda parsing across months but keeps the inferred year in the cache key", async () => {
  fetchMock.mockImplementation(async () => new Response(agendaHtml));
  const june = await request(() => getEvents("2026-06"));
  const july = await request(() => getEvents("2026-07"));
  const empty = await request(() => getEvents("2026-08"));
  expect(june.data.items.map((item) => item.id)).toEqual(["/juny"]);
  expect(july.data.items.map((item) => item.id)).toEqual(["/juliol"]);
  expect(empty.data.items).toEqual([]);
  expect(empty.health.status).toBe("empty");
  expect(fetchMock).toHaveBeenCalledTimes(2);
  const nextYear = await request(() => getEvents("2027-06"));
  expect(nextYear.data.items[0].startsAt).toBe("2027-06-18T10:00:00.000Z");
  expect(fetchMock).toHaveBeenCalledTimes(4);
});

it("does not cache a partial agenda when its second page fails", async () => {
  fetchMock.mockResolvedValueOnce(new Response(agendaHtml));
  fetchMock.mockResolvedValueOnce(new Response("Unavailable", { status: 502 }));
  expect((await request(() => getEvents("2026-06"))).health.status).toBe("error");
  expect(entries.size).toBe(0);
  fetchMock.mockImplementation(async () => new Response(agendaHtml));
  expect((await request(() => getEvents("2026-06"))).data.items).toHaveLength(1);
  expect(fetchMock).toHaveBeenCalledTimes(4);
});

it.each(scenarios.filter(({ name }) => name === "weather" || name === "beaches"))(
  "$name retries malformed upstream JSON without caching the fallback",
  async ({ get, body }) => {
    fetchMock.mockImplementation(async () => new Response('{"unexpected":true}'));
    expect((await request(get)).headers.get("x-source-health")).toBe("error");
    expect(entries.size).toBe(0);
    fetchMock.mockImplementation(async () => new Response(body));
    expect((await request(get)).headers.get("x-source-health")).toBe("fresh");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  }
);

it("does not cache a failed HTML body read", async () => {
  const response = new Response(newsHtml);
  vi.spyOn(response, "text").mockRejectedValue(new Error("Body interrupted"));
  fetchMock.mockResolvedValueOnce(response);
  expect((await request(newsGET)).headers.get("cache-control")).toBe("no-store");
  expect(entries.size).toBe(0);
  fetchMock.mockResolvedValueOnce(new Response(newsHtml));
  expect((await request(newsGET)).headers.get("x-source-health")).toBe("fresh");
});

it("caches a successful empty news response", async () => {
  fetchMock.mockImplementation(async () => new Response("<main></main>"));
  const empty = await request(newsGET);
  expect((await empty.json()).items).toEqual([]);
  expect(empty.headers.get("x-source-health")).toBe("empty");
  expect(empty.headers.get("cache-control")).toContain("s-maxage=900");
  await request(newsGET);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("keeps beach season checks outside the active-data cache", async () => {
  fetchMock.mockImplementation(async () => new Response(scenarios[3].body));
  const active = await request(() => getBeachStatuses(new Date(2026, 8, 30)));
  const inactive = await request(() => getBeachStatuses(new Date(2026, 9, 1)));
  expect(active.data.active).toBe(true);
  expect(inactive.data).toMatchObject({ active: false, beaches: [] });
  expect(inactive.health.status).toBe("empty");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("expires the default agenda response before the UTC month changes", async () => {
  vi.setSystemTime(new Date("2026-06-30T23:59:00Z"));
  fetchMock.mockImplementation(async () => new Response(agendaHtml));
  const result = await request(() => eventsGET(new NextRequest("http://localhost/api/events")));
  expect(result.headers.get("cache-control")).toContain("s-maxage=60,");
});

it("expires the beach response before the local season boundary", async () => {
  vi.setSystemTime(new Date(2026, 8, 30, 23, 59));
  fetchMock.mockImplementation(async () => new Response(scenarios[3].body));
  const result = await request(beachesGET);
  expect(result.headers.get("cache-control")).toContain("s-maxage=60,");
});

it("does not cache an active beach response if fetching crosses the season boundary", async () => {
  vi.setSystemTime(new Date(2026, 8, 30, 23, 59));
  fetchMock.mockImplementation(async () => {
    vi.setSystemTime(new Date(2026, 9, 1, 0, 0, 1));
    return new Response(scenarios[3].body);
  });
  const result = await request(beachesGET);
  expect(result.headers.get("cache-control")).toBe("no-store");
  expect((await (await request(beachesGET)).json()).active).toBe(false);
});

it("does not share a response with an unknown or expired source timestamp", () => {
  const health = { status: "fresh" as const, sourceUrl: "https://example.com" };
  for (const sourceUpdatedAt of [undefined, "invalid", new Date(Date.now() - 900_000).toISOString()]) {
    expect(sourceResponseHeaders({ ...health, sourceUpdatedAt }, 900)["cache-control"]).toBe("no-store");
  }
});
