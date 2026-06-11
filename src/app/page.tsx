import { BadalonaMarApp } from "@/components/badalonamar-app";
import { getBeachStatuses } from "@/lib/sources/beaches";
import { getEvents } from "@/lib/sources/events";
import { getNews } from "@/lib/sources/news";
import { getRecommendations } from "@/lib/sources/recommendations";
import { getWeatherToday } from "@/lib/sources/weather";

function currentBarcelonaMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

export default async function Home() {
  const [weather, beaches, news, events, recommendations] = await Promise.all([
    getWeatherToday(),
    getBeachStatuses(),
    getNews(),
    getEvents(currentBarcelonaMonth()),
    getRecommendations()
  ]);

  return (
    <BadalonaMarApp
      weather={weather}
      beaches={beaches}
      news={news}
      events={events}
      recommendations={recommendations}
    />
  );
}
