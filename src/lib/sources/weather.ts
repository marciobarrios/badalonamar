import { z } from "zod";
import { unstable_cache } from "next/cache";
import type { WeatherToday } from "@/lib/types";
import { WEATHER_URL } from "@/lib/sources/constants";
import { nowIso, numberOrNull, sourceError, sourceOk } from "@/lib/sources/helpers";
import { WEATHER_REVALIDATE_SECONDS, withSourceFreshness } from "@/lib/sources/cache";

const weatherSchema = z.object({
  status: z.number().optional(),
  today: z.object({
    min_temp: z.string().nullable().optional(),
    max_temp: z.string().nullable().optional(),
    max_humi: z.string().nullable().optional(),
    sky_status: z.string().nullable().optional(),
    sky_status_desc: z.string().nullable().optional()
  })
});

export function parseWeatherPayload(payload: unknown): WeatherToday {
  const parsed = weatherSchema.parse(payload);
  return {
    minTemp: numberOrNull(parsed.today.min_temp),
    maxTemp: numberOrNull(parsed.today.max_temp),
    skyStatus: parsed.today.sky_status ?? null,
    skyDescription: parsed.today.sky_status_desc ?? null,
    humidity: numberOrNull(parsed.today.max_humi),
    sourceUpdatedAt: nowIso()
  };
}

const getCachedWeather = unstable_cache(
  async () => {
    const response = await fetch(WEATHER_URL, {
      cache: "no-store",
      headers: { accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(`Weather source returned ${response.status}`);
    }
    const data = parseWeatherPayload(await response.json());
    return sourceOk(data, WEATHER_URL, data.sourceUpdatedAt);
  },
  ["badalona-weather-v1", WEATHER_URL],
  { revalidate: WEATHER_REVALIDATE_SECONDS }
);

export async function getWeatherToday() {
  try {
    return withSourceFreshness(await getCachedWeather(), WEATHER_REVALIDATE_SECONDS);
  } catch (error) {
    return sourceError<WeatherToday>(
      {
        minTemp: null,
        maxTemp: null,
        skyStatus: null,
        skyDescription: null,
        humidity: null,
        sourceUpdatedAt: nowIso()
      },
      WEATHER_URL,
      error instanceof Error ? error.message : "No s'ha pogut carregar el temps"
    );
  }
}
