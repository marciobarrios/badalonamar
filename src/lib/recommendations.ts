import type { Recommendation } from "@/lib/types";

export const recommendations: Recommendation[] = [
  {
    id: "pont-del-petroli",
    title: "Pont del Petroli",
    category: "llocs",
    description:
      "Passeig imprescindible per entendre la relació de Badalona amb el mar, encara que l'entorn canviï amb les obres.",
    neighborhood: "Mar",
    tags: ["passeig", "mar", "icona"]
  },
  {
    id: "biblioteca-canyado-casagemes",
    title: "Biblioteca Canyadó i Casagemes - Joan Argenté",
    category: "llocs",
    description:
      "Un punt tranquil per llegir, trobar activitats petites i mantenir el pols cultural del barri.",
    neighborhood: "Canyado",
    tags: ["cultura", "families", "barri"]
  },
  {
    id: "can-casacuberta",
    title: "Biblioteca Can Casacuberta",
    category: "llocs",
    description:
      "Una biblioteca central molt pràctica per estudiar, consultar agenda i entrar al Centre sense presses.",
    neighborhood: "Centre",
    tags: ["cultura", "centre", "estudi"]
  },
  {
    id: "anis-del-mono",
    title: "Fàbrica de l'Anís del Mono",
    category: "llocs",
    description:
      "Patrimoni industrial arran de via, amb visites que connecten història local, disseny i memòria obrera.",
    neighborhood: "Mar",
    tags: ["patrimoni", "visita", "historia"]
  },
  {
    id: "llibreria-fenix",
    title: "Llibreria Fènix",
    category: "botigues",
    description:
      "Llibreria de proximitat per descobrir novetats, demanar recomanacions i mantenir viu el comerç cultural.",
    neighborhood: "Centre",
    tags: ["llibres", "comerc", "cultura"]
  },
  {
    id: "patis-vela",
    title: "Patins de vela",
    category: "llocs",
    description:
      "Una escena molt badalonina: esport, mar i vida de club mirant cap a la platja.",
    neighborhood: "Mar",
    tags: ["esport", "platja", "mar"]
  },
  {
    id: "restaurant-pendent",
    title: "Restaurants del front marítim",
    category: "restaurants",
    description:
      "Espai pendent de curació: una selecció curta de llocs fiables per menjar prop del passeig.",
    neighborhood: "Mar",
    tags: ["pendent", "menjar", "mar"]
  },
  {
    id: "creadors-locals",
    title: "Creadors locals",
    category: "creadors",
    description:
      "Espai pendent per reunir perfils que expliquen Badalona amb mirada pròpia, vídeo, foto o agenda cultural.",
    neighborhood: "Badalona",
    tags: ["pendent", "xarxes", "comunitat"]
  }
];
