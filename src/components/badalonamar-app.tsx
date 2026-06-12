"use client";

import { Tabs } from "@base-ui/react/tabs";
import Image from "next/image";
import {
  CalendarDays,
  CloudSun,
  ExternalLink,
  MapPin,
  Newspaper,
  Sailboat,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  SunMedium,
  Waves
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SourceNote } from "@/components/source-note";
import type {
  BeachStatus,
  EventItem,
  NewsItem,
  Recommendation,
  SourceResult,
  WeatherToday
} from "@/lib/types";
import { BDNCOM_WHATSAPP_URL } from "@/lib/sources/constants";
import { cn } from "@/lib/utils";

type AppProps = {
  weather: SourceResult<WeatherToday>;
  beaches: SourceResult<{
    active: boolean;
    beaches: BeachStatus[];
    sourceUpdatedAt: string;
  }>;
  news: SourceResult<{
    items: NewsItem[];
    source: "bdncom";
    sourceUrl: string;
  }>;
  events: SourceResult<{
    items: EventItem[];
    sourceUrl: string;
  }>;
  recommendations: SourceResult<{
    items: Recommendation[];
    source: "curated";
    sourceUrl: string;
  }>;
};

const tabs = [
  { value: "avui", label: "Avui", icon: SunMedium },
  { value: "platges", label: "Platges", icon: Waves },
  { value: "agenda", label: "Agenda", icon: CalendarDays },
  { value: "recomanacions", label: "Reco", icon: Sparkles }
];

function formatDate(date: string | null) {
  if (!date) {
    return null;
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.valueOf())) {
    return date;
  }

  return new Intl.DateTimeFormat("ca", {
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Madrid"
  }).format(parsed);
}

function formatEventDay(event: EventItem) {
  if (!event.startsAt) {
    return event.dateLabel || null;
  }

  const parsed = new Date(event.startsAt);
  if (Number.isNaN(parsed.valueOf())) {
    return event.dateLabel || event.startsAt;
  }

  return new Intl.DateTimeFormat("ca", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Madrid"
  })
    .format(parsed)
    .replace(".", "");
}

function parseBeachDataDate(date: string | null) {
  if (!date) {
    return null;
  }

  const municipalDate = date.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/
  );

  if (municipalDate) {
    const [, day, month, year, hour, minute] = municipalDate;
    return {
      date: new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12)),
      sortKey: `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}${(hour ?? "00").padStart(2, "0")}${minute ?? "00"}`
    };
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }

  return {
    date: parsed,
    sortKey: String(parsed.valueOf()).padStart(13, "0")
  };
}

function formatBeachDataDay(beaches: BeachStatus[]) {
  const latest = beaches
    .map((beach) => parseBeachDataDate(beach.updatedAt))
    .filter((date): date is NonNullable<ReturnType<typeof parseBeachDataDate>> => Boolean(date))
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))[0];

  if (!latest) {
    return null;
  }

  const day = new Intl.DateTimeFormat("ca", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC"
  })
    .format(latest.date)
    .replace(",", "");

  return day;
}

function skyInCatalan(description: string | null) {
  if (!description) {
    return "Temps variable";
  }

  const map: Record<string, string> = {
    "Muy nuboso": "Molt ennuvolat",
    Despejado: "Cel serè",
    Nuboso: "Ennuvolat",
    "Poco nuboso": "Poc ennuvolat",
    Lluvia: "Pluja"
  };

  return map[description] ?? description;
}

function flagClass(flag: string) {
  if (flag === "VERDA") {
    return "bg-emerald-500";
  }
  if (flag === "GROGA") {
    return "bg-amber-400";
  }
  if (flag === "VERMELLA") {
    return "bg-red-500";
  }
  return "bg-muted-foreground";
}

function CategoryIcon({ category }: { category: Recommendation["category"] }) {
  const Icon =
    category === "restaurants"
      ? Store
      : category === "botigues"
        ? ShoppingBag
        : category === "creadors"
          ? Sparkles
          : MapPin;
  return <Icon className="h-4 w-4" aria-hidden="true" />;
}

function EmptyState({
  title,
  text,
  icon: Icon
}: {
  title: string;
  text: string;
  icon: typeof Search;
}) {
  return (
    <div className="rounded-lg bg-card px-4 py-6 text-center shadow-sm">
      <Icon className="mx-auto mb-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-normal text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function WeatherHero({ weather }: { weather: SourceResult<WeatherToday> }) {
  const data = weather.data;

  return (
    <section className="relative overflow-hidden rounded-lg bg-card px-5 py-5 shadow-sm">
      <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-accent/60 blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">BadalonaMar</p>
            <h1 className="mt-2 max-w-[13ch] text-3xl font-bold leading-none tracking-normal">
              El dia arran de mar
            </h1>
          </div>
          <CloudSun className="h-9 w-9 text-primary" aria-hidden="true" />
        </div>
        <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{skyInCatalan(data.skyDescription)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Canyadó, Casagemes, Centre i platges properes
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold leading-none">
              {data.maxTemp ?? "·"}°
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              min {data.minTemp ?? "·"}°
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {data.humidity !== null ? (
            <Badge variant="outline">Humitat {data.humidity}%</Badge>
          ) : null}
          <SourceNote health={weather.health} />
        </div>
      </div>
    </section>
  );
}

function NewsList({ news }: { news: AppProps["news"] }) {
  return (
    <section className="space-y-4">
      <SectionTitle eyebrow="Actualitat" title="Notícies d'avui">
        <span className="rounded-md bg-secondary px-2 py-1 text-xs font-bold text-primary">
          BDNCom
        </span>
      </SectionTitle>
      <div className="space-y-3">
        {news.data.items.length ? (
          news.data.items.slice(0, 5).map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="group grid grid-cols-[72px_1fr] gap-3 rounded-lg bg-card p-2 shadow-sm transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="relative h-[72px] overflow-hidden rounded-md bg-muted">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="72px"
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <Newspaper className="m-5 h-7 w-7 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 py-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.title}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(item.publishedAt) ?? "BDNCom"}</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </div>
              </div>
            </a>
          ))
        ) : (
          <EmptyState
            title="Cap notícia carregada"
            text="La font de BDNCom no ha retornat articles ara mateix."
            icon={Newspaper}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SourceNote health={news.health} />
        <a
          href={BDNCOM_WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          Canal de WhatsApp de BDNCom
        </a>
      </div>
    </section>
  );
}

function BeachCard({ beach }: { beach: BeachStatus }) {
  return (
    <Card
      className={cn(
        "overflow-hidden",
        beach.nearby && "shadow-[0_10px_26px_oklch(0.52_0.112_205_/_0.18)]"
      )}
    >
      <div className="grid grid-cols-[88px_1fr]">
        <div className="relative min-h-28 bg-muted">
          {beach.photo ? (
            <Image
              src={beach.photo}
              alt=""
              fill
              sizes="88px"
              className="object-cover"
            />
          ) : null}
          <span
            className={cn("absolute left-2 top-2 h-3 w-3 rounded-full", flagClass(beach.flag))}
            aria-label={`Bandera ${beach.flag}`}
          />
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold leading-tight">{beach.name}</h3>
            {beach.nearby ? <Badge>A prop</Badge> : null}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-muted-foreground">Aigua</dt>
              <dd className="font-semibold">{beach.waterTemp ?? "·"}°</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mar</dt>
              <dd className="truncate font-semibold">{beach.seaState ?? "Sense dades"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Qualitat</dt>
              <dd className="truncate font-semibold">{beach.waterQuality ?? "Sense dades"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Meduses</dt>
              <dd className="font-semibold">{beach.jellyfish ?? "Sense dades"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </Card>
  );
}

function BeachesPanel({ beaches }: { beaches: AppProps["beaches"] }) {
  const dataDay = formatBeachDataDay(beaches.data.beaches);

  return (
    <section className="space-y-4">
      <SectionTitle eyebrow="Temporada de bany" title="Estat de les platges">
        <div className="flex items-center gap-2 text-left">
          <Sailboat className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          {dataDay ? (
            <span className="max-w-36 text-left text-xs leading-tight">
              <span className="block font-medium text-muted-foreground/70">Dades del</span>
              <span className="block font-bold text-foreground">{dataDay}</span>
            </span>
          ) : null}
        </div>
      </SectionTitle>
      {!beaches.data.active ? (
        <EmptyState
          title="La temporada encara no és activa"
          text="Mostrarem banderes i estat del mar entre l'1 de juny i el 30 de setembre."
          icon={Waves}
        />
      ) : beaches.data.beaches.length ? (
        <div className="space-y-3">
          {beaches.data.beaches.map((beach) => (
            <BeachCard key={beach.name} beach={beach} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sense estat de platges"
          text="No hem pogut llegir les dades municipals de platges."
          icon={Waves}
        />
      )}
      <SourceNote health={beaches.health} />
    </section>
  );
}

function EventsPanel({ events }: { events: AppProps["events"] }) {
  return (
    <section className="space-y-4">
      <SectionTitle eyebrow="Aquest mes" title="Agenda local">
        <CalendarDays className="h-6 w-6 text-primary" aria-hidden="true" />
      </SectionTitle>
      {events.data.items.length ? (
        <div className="space-y-3">
          {events.data.items.map((event) => {
            const eventDay = formatEventDay(event);

            return (
              <a
                key={event.id}
                href={event.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg bg-card p-4 shadow-sm transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{event.typeLabel}</Badge>
                      {eventDay ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          {eventDay}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-2 text-base font-bold leading-tight">{event.title}</h3>
                  </div>
                  <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                {event.place ? (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {event.place}
                  </p>
                ) : null}
                {event.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                ) : null}
              </a>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Agenda buida"
          text="No hem trobat actes del mes amb les dades disponibles."
          icon={CalendarDays}
        />
      )}
      <SourceNote health={events.health} />
    </section>
  );
}

function RecommendationsPanel({
  recommendations
}: {
  recommendations: AppProps["recommendations"];
}) {
  const items = recommendations.data.items;

  return (
    <section className="space-y-4">
      <SectionTitle eyebrow="Guia viva" title="Recomanacions">
        <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
      </SectionTitle>
      <div className="grid min-w-0 gap-3">
        {items.map((item) => (
          <Card key={item.id} className="min-w-0 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                    <CategoryIcon category={item.category} />
                  </span>
                  <CardTitle className="min-w-0 truncate">{item.title}</CardTitle>
                </div>
                <Badge variant="outline">{item.neighborhood}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              {item.address || item.scoreLabel || item.sourceLabel ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                  {item.scoreLabel ? <span>{item.scoreLabel}</span> : null}
                  {item.address ? (
                    <span className="line-clamp-1 min-w-0">{item.address}</span>
                  ) : null}
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                    >
                      {item.sourceLabel ?? "Obrir"}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant={tag === "pendent" ? "coral" : "secondary"}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Curació local</p>
        <SourceNote health={recommendations.health} />
      </div>
    </section>
  );
}

function TodayPanel({
  weather,
  beaches,
  news,
  events
}: Pick<AppProps, "weather" | "beaches" | "news" | "events">) {
  const nearbyBeach = beaches.data.beaches.find((beach) => beach.nearby);
  const nextEvent = events.data.items[0];

  return (
    <div className="space-y-6">
      <WeatherHero weather={weather} />
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Waves className="h-4 w-4 text-primary" aria-hidden="true" />
              Platja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{nearbyBeach?.flag ?? "·"}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {nearbyBeach
                ? `${nearbyBeach.name}, ${nearbyBeach.seaState ?? "estat pendent"}`
                : beaches.data.active
                  ? "Dades pendents"
                  : "Fora de temporada"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              Proper acte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-2 text-sm font-bold">
              {nextEvent?.title ?? "Agenda pendent"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {nextEvent?.dateLabel || "Aquest mes"}
            </p>
          </CardContent>
        </Card>
      </div>
      <NewsList news={news} />
    </div>
  );
}

export function BadalonaMarApp({
  weather,
  beaches,
  news,
  events,
  recommendations
}: AppProps) {
  return (
    <Tabs.Root defaultValue="avui" className="mx-auto min-h-svh w-full max-w-md pb-28">
      <main className="px-4 pb-8 pt-5">
        <Tabs.Panel value="avui" keepMounted={false}>
          <TodayPanel weather={weather} beaches={beaches} news={news} events={events} />
        </Tabs.Panel>
        <Tabs.Panel value="platges" keepMounted={false}>
          <BeachesPanel beaches={beaches} />
        </Tabs.Panel>
        <Tabs.Panel value="agenda" keepMounted={false}>
          <EventsPanel events={events} />
        </Tabs.Panel>
        <Tabs.Panel value="recomanacions" keepMounted={false}>
          <RecommendationsPanel recommendations={recommendations} />
        </Tabs.Panel>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.55rem)] pt-2 backdrop-blur">
        <Tabs.List className="mx-auto grid h-16 max-w-md grid-cols-4 gap-1" aria-label="Seccions">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Tabs.Tab
                key={tab.value}
                value={tab.value}
                className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active]:bg-primary data-[active]:text-primary-foreground"
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="truncate">{tab.label}</span>
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
      </div>
    </Tabs.Root>
  );
}
