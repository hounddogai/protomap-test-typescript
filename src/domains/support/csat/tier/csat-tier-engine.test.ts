import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatTierEngine } from "./csat-tier-engine.js";
import { newCsatTier } from "./csat-tier.js";

test("CsatTierEngine keeps results within bounds", () => {
  const engine = defaultCsatTierEngine();
  const item = newCsatTier("code-759", "title-401");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
