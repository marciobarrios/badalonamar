export type NeighborhoodTag =
  | "Canyado"
  | "Casagemes"
  | "Centre"
  | "Mar"
  | "Badalona";

export type SourceHealth = {
  status: "fresh" | "stale" | "empty" | "error";
  message?: string;
  sourceUrl: string;
  sourceUpdatedAt?: string;
};

export type WeatherToday = {
  minTemp: number | null;
  maxTemp: number | null;
  skyStatus: string | null;
  skyDescription: string | null;
  humidity: number | null;
  sourceUpdatedAt: string;
};

export type BeachStatus = {
  name: string;
  photo: string | null;
  flag: "VERDA" | "GROGA" | "VERMELLA" | "SENSE_DADES" | string;
  seaState: string | null;
  jellyfish: string | null;
  waterTemp: number | null;
  airTemp: number | null;
  waterQuality: string | null;
  uvi: string | null;
  updatedAt: string | null;
  nearby: boolean;
};

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  image: string | null;
  publishedAt: string | null;
  location: string | null;
  neighborhoodTags: NeighborhoodTag[];
};

export type EventItem = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  dateLabel: string;
  startsAt: string | null;
  place: string | null;
  neighborhoodTags: NeighborhoodTag[];
};

export type Recommendation = {
  id: string;
  title: string;
  category: "llocs" | "restaurants" | "botigues" | "creadors";
  description: string;
  neighborhood: NeighborhoodTag;
  address?: string;
  url?: string;
  image?: string;
  tags: string[];
};

export type SourceResult<T> = {
  data: T;
  health: SourceHealth;
};
