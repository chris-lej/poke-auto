import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { isPokemonCenterProductUrl } from "../dist/workers/discovery.js";

describe("isPokemonCenterProductUrl", () => {
  it("accepts pokemoncenter.com with /product/ in path", () => {
    strictEqual(
      isPokemonCenterProductUrl(
        "https://www.pokemoncenter.com/en-us/p/123-45678/foo",
      ),
      true,
    );
  });

  it("accepts regional subdomain", () => {
    strictEqual(
      isPokemonCenterProductUrl(
        "https://uk.pokemoncenter.com/product/some-slug",
      ),
      true,
    );
  });

  it("rejects non-product paths", () => {
    strictEqual(
      isPokemonCenterProductUrl("https://www.pokemoncenter.com/en-us/"),
      false,
    );
  });

  it("rejects other hosts", () => {
    strictEqual(
      isPokemonCenterProductUrl("https://example.com/product/foo"),
      false,
    );
  });
});
