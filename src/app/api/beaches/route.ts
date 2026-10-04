import { NextResponse } from "next/server";
import { getBeachStatuses } from "@/lib/sources/beaches";
import { BEACHES_REVALIDATE_SECONDS, sourceResponseHeaders } from "@/lib/sources/cache";

export async function GET() {
  const now = new Date();
  const result = await getBeachStatuses(now);
  // The season check runs per request; don't carry today's active state into tomorrow.
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return NextResponse.json(result.data, {
    headers: sourceResponseHeaders(
      result.health,
      BEACHES_REVALIDATE_SECONDS,
      (midnight.getTime() - Date.now()) / 1000
    )
  });
}
