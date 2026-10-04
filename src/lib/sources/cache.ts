import type { SourceHealth, SourceResult } from "@/lib/types";

export const NEWS_REVALIDATE_SECONDS = 60 * 15;
export const EVENTS_REVALIDATE_SECONDS = 60 * 60;
export const WEATHER_REVALIDATE_SECONDS = 60 * 30;
export const BEACHES_REVALIDATE_SECONDS = 60 * 20;

function remainingFreshness(health: SourceHealth, revalidate: number) {
  const updatedAt = Date.parse(health.sourceUpdatedAt ?? "");
  if (!Number.isFinite(updatedAt)) {
    return 0;
  }
  const age = Math.max(0, Date.now() - updatedAt);
  return Math.max(0, Math.floor(revalidate - age / 1000));
}

export function withSourceFreshness<T>(result: SourceResult<T>, revalidate: number) {
  // Next can return the last successful value while revalidating in the background.
  if (
    (result.health.status === "fresh" || result.health.status === "empty") &&
    remainingFreshness(result.health, revalidate) === 0
  ) {
    return { ...result, health: { ...result.health, status: "stale" as const } };
  }
  return result;
}

export function sourceResponseHeaders(
  health: SourceHealth,
  revalidate: number,
  maxAge = revalidate
) {
  const remaining = Math.min(remainingFreshness(health, revalidate), Math.floor(maxAge));
  const cacheable =
    (health.status === "fresh" || health.status === "empty") && remaining > 0;

  return {
    // Share only the remaining source lifetime, so CDN and data-cache ages don't add up.
    "cache-control": cacheable
      ? `public, max-age=0, s-maxage=${remaining}, must-revalidate`
      : "no-store",
    "x-source-health": health.status,
    "x-source-url": health.sourceUrl
  };
}
