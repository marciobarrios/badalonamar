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
      typeLabel: "Lectura",
      dateLabel: "18 de juny",
      startsAt: "2026-06-18T10:00:00.000Z",
      place: "Biblioteca Canyadó i Casagemes - Joan Argenté"
    });
    expect(items[0]?.neighborhoodTags).toContain("Canyado");
    expect(items[0]?.neighborhoodTags).toContain("Casagemes");
  });

  it("uses the full event container and ignores generic agenda labels", () => {
    const items = parseAgendaPage(
      `
      <article>
        <span>AGENDA</span>
        <time>19/06/2026</time>
        <div>
          <h3>
            <a href="/ca/actualitat/agenda/primers-auxilis">
              Taller de primers auxilis i l'ús del desfibril·lador
            </a>
          </h3>
        </div>
        <p>Centre Cívic Can Cabanes</p>
      </article>
    `,
      2026
    );

    expect(items[0]).toMatchObject({
      title: "Taller de primers auxilis i l'ús del desfibril·lador",
      typeLabel: "Taller",
      dateLabel: "19/06/2026",
      startsAt: "2026-06-19T10:00:00.000Z",
      place: "Centre Cívic Can Cabanes"
    });
  });
});
