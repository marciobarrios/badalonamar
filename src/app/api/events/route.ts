import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/sources/events";

export async function GET(request: NextRequest) {
  const month =
    request.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const result = await getEvents(month);
  return NextResponse.json(result.data, {
    headers: {
      "x-source-health": result.health.status,
      "x-source-url": result.health.sourceUrl
    }
  });
}
