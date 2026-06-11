import { NextResponse } from "next/server";
import { getWeatherToday } from "@/lib/sources/weather";

export async function GET() {
  const result = await getWeatherToday();
  return NextResponse.json(result.data, {
    headers: {
      "x-source-health": result.health.status,
      "x-source-url": result.health.sourceUrl
    }
  });
}
