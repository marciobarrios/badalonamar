import { describe, expect, it } from "vitest";
import { parseBeachesPayload } from "@/lib/sources/beaches";

describe("parseBeachesPayload", () => {
  it("prioritizes nearby beaches and normalizes status data", () => {
    const beaches = parseBeachesPayload({
      beaches: [
        {
          nom: "Platja de la Marina",
          foto: "https://example.com/marina.jpg",
          estat_platja: [{ bandera: "GROGA", temp_aigua: "21.50" }]
        },
        {
          nom: "Platja del Cristall",
          foto: "https://example.com/cristall.jpg",
          estat_platja: [
            {
              data: "10/06/2026 10:25:27",
              bandera: "VERDA",
              estat_mar: "Mar arrissada",
              meduses: "No",
              temp_aigua: "22.00",
              temp_ambient: "21.00",
              qualitat_aigua: "molt bo",
              uvi: "Baix"
            }
          ]
        }
      ]
    });

    expect(beaches[0]).toMatchObject({
      name: "Platja del Cristall",
      nearby: true,
      flag: "VERDA",
      waterTemp: 22,
      airTemp: 21,
      waterQuality: "molt bo"
    });
  });
});
