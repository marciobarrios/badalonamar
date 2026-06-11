import { describe, expect, it } from "vitest";
import { parseAgendaPage } from "@/lib/sources/events";

describe("parseAgendaPage", () => {
  it("extracts event title, date, place, and locality tags", () => {
    const items = parseAgendaPage(
      `
      <ul>
        <li>
          <span>18 de juny</span>
          <h3><a href="/ca/actualitat/agenda/postals">Postals i cartes de Joan Argenté</a></h3>
          <p>Biblioteca Canyadó i Casagemes - Joan Argenté</p>
        </li>
      </ul>
    `,
      2026
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "Postals i cartes de Joan Argenté",
      dateLabel: "18 de juny",
      startsAt: "2026-06-18T10:00:00.000Z"
    });
    expect(items[0]?.neighborhoodTags).toContain("Canyado");
    expect(items[0]?.neighborhoodTags).toContain("Casagemes");
  });
});
