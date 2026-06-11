import { describe, expect, it } from "vitest";
import { parseBdncomNews } from "@/lib/sources/news";

describe("parseBdncomNews", () => {
  it("extracts rendered BDNCom article links", () => {
    const items = parseBdncomNews(`
      <main>
        <a href="/ca/el-modernisme-a-badalona-a-traves-de-la-moda">
          <img alt="El modernisme a Badalona a través de la moda" src="https://cdn-bdncom.watchity.net/a.jpeg" />
          <h6><div><p>El modernisme a Badalona a través de la moda</p></div></h6>
          <time datetime="2026-06-10T18:16:11.529+00:00">10/06/2026</time>
          <p>Badalona</p>
        </a>
        <a href="/ca/collections/actualitat">Actualitat</a>
      </main>
    `);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "el-modernisme-a-badalona-a-traves-de-la-moda",
      title: "El modernisme a Badalona a través de la moda",
      image: "https://cdn-bdncom.watchity.net/a.jpeg",
      location: "Badalona"
    });
  });
});
