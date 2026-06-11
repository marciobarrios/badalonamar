import { z } from "zod";
import type { BeachStatus } from "@/lib/types";
import { BEACHES_URL, NEARBY_BEACHES } from "@/lib/sources/constants";
import { isSummer, nowIso, numberOrNull, sourceError, sourceOk } from "@/lib/sources/helpers";

const beachSchema = z.object({
  beaches: z.array(
    z.object({
      nom: z.string(),
      foto: z.string().nullable().optional(),
      estat_platja: z
        .array(
          z.object({
            data: z.string().nullable().optional(),
            bandera: z.string().nullable().optional(),
            estat_mar: z.string().nullable().optional(),
            meduses: z.string().nullable().optional(),
            temp_aigua: z.string().nullable().optional(),
            temp_ambient: z.string().nullable().optional(),
            qualitat_aigua: z.string().nullable().optional(),
            uvi: z.string().nullable().optional()
          })
        )
        .optional()
    })
  )
});

export function parseBeachesPayload(payload: unknown): BeachStatus[] {
  const parsed = beachSchema.parse(payload);
  return parsed.beaches
    .map((beach) => {
      const status = beach.estat_platja?.[0];
      const nearby = NEARBY_BEACHES.some((name) => name === beach.nom);
      return {
        name: beach.nom,
        photo: beach.foto ?? null,
        flag: status?.bandera ?? "SENSE_DADES",
        seaState: status?.estat_mar ?? null,
        jellyfish: status?.meduses ?? null,
        waterTemp: numberOrNull(status?.temp_aigua),
        airTemp: numberOrNull(status?.temp_ambient),
        waterQuality: status?.qualitat_aigua ?? null,
        uvi: status?.uvi ?? null,
        updatedAt: status?.data ?? null,
        nearby
      };
    })
    .sort((a, b) => Number(b.nearby) - Number(a.nearby));
}

export async function getBeachStatuses(date = new Date()) {
  const active = isSummer(date);

  if (!active) {
    return sourceOk(
      { active, beaches: [] as BeachStatus[], sourceUpdatedAt: nowIso() },
      BEACHES_URL,
      nowIso(),
      "empty"
    );
  }

  try {
    const response = await fetch(BEACHES_URL, {
      next: { revalidate: 60 * 20 },
      headers: { accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(`Beach source returned ${response.status}`);
    }
    const beaches = parseBeachesPayload(await response.json());
    return sourceOk(
      { active, beaches, sourceUpdatedAt: nowIso() },
      BEACHES_URL,
      nowIso(),
      beaches.length ? "fresh" : "empty"
    );
  } catch (error) {
    return sourceError(
      { active, beaches: [] as BeachStatus[], sourceUpdatedAt: nowIso() },
      BEACHES_URL,
      error instanceof Error
        ? error.message
        : "No s'ha pogut carregar l'estat de les platges"
    );
  }
}
