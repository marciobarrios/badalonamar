import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/sources/events";
import { EVENTS_REVALIDATE_SECONDS, sourceResponseHeaders } from "@/lib/sources/cache";

export async function GET(request: NextRequest) {
  const requestedMonth = request.nextUrl.searchParams.get("month");
  const now = new Date();
  const month = requestedMonth ?? now.toISOString().slice(0, 7);
  const result = await getEvents(month);
  // A response for the implicit current month must expire before the month changes.
  const nextMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return NextResponse.json(result.data, {
    headers: sourceResponseHeaders(
      result.health,
      EVENTS_REVALIDATE_SECONDS,
      requestedMonth === null ? (nextMonth - Date.now()) / 1000 : EVENTS_REVALIDATE_SECONDS
    )
  });
}
