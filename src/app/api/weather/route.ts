import { NextResponse } from "next/server";
import { getWeatherToday } from "@/lib/sources/weather";
import { WEATHER_REVALIDATE_SECONDS, sourceResponseHeaders } from "@/lib/sources/cache";

export async function GET() {
  const result = await getWeatherToday();
  return NextResponse.json(result.data, {
    headers: sourceResponseHeaders(result.health, WEATHER_REVALIDATE_SECONDS)
  });
}
