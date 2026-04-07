import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import {
  evaluatePokemonCenterFromBodyText,
} from "../dist/evaluators/pokemonCenterProduct.js";

describe("evaluatePokemonCenterFromBodyText (fixture text)", () => {
  it("classifies in stock when Add to Cart appears", () => {
    const e = evaluatePokemonCenterFromBodyText(
      "Some Product\n$19.99\nAdd to Cart\nDetails here",
    );
    strictEqual(e.status, "in_stock");
    strictEqual(e.reason, "add_to_cart_signal");
    strictEqual(typeof e.pageHash, "string");
    strictEqual(e.pageHash.length, 64);
  });

  it("classifies out of stock when sold out appears", () => {
    const e = evaluatePokemonCenterFromBodyText(
      "Collectible Figure\nSold Out\nNotify me when available",
    );
    strictEqual(e.status, "out_of_stock");
    strictEqual(e.reason, "sold_out_signal");
  });

  it("returns unknown when buy and sold signals conflict", () => {
    const e = evaluatePokemonCenterFromBodyText(
      "Add to cart\nAlso sold out today",
    );
    strictEqual(e.status, "unknown");
    strictEqual(e.reason, "conflicting_buy_and_sold_signals");
  });

  it("returns blocked on obvious gate copy", () => {
    const e = evaluatePokemonCenterFromBodyText("Please verify you are human");
    strictEqual(e.status, "blocked");
    strictEqual(e.reason, "possible_gate_or_bot_challenge");
  });
});
