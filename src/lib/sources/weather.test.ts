import { describe, expect, it } from "vitest";
import { parseWeatherPayload } from "@/lib/sources/weather";

describe("parseWeatherPayload", () => {
  it("normalizes the city weather payload", () => {
    const weather = parseWeatherPayload({
      status: 1,
      today: {
        min_temp: "18",
        max_temp: "24",
        max_humi: "60",
        sky_status: "15",
        sky_status_desc: "Muy nuboso"
      }
    });

    expect(weather).toMatchObject({
      minTemp: 18,
      maxTemp: 24,
      humidity: 60,
      skyStatus: "15",
      skyDescription: "Muy nuboso"
    });
    expect(weather.sourceUpdatedAt).toEqual(expect.any(String));
  });
});
