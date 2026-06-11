import { recommendations as curatedRecommendations } from "@/lib/recommendations";
import { BADALONA_CITY_URL } from "@/lib/sources/constants";
import { nowIso, sourceOk } from "@/lib/sources/helpers";

export async function getRecommendations() {
  return sourceOk(
    {
      items: curatedRecommendations.map((item) => ({ ...item, source: "curated" as const })),
      source: "curated" as const,
      sourceUrl: BADALONA_CITY_URL
    },
    BADALONA_CITY_URL,
    nowIso(),
    "stale"
  );
}
