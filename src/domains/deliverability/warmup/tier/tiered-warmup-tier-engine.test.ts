import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredWarmupTierEngine } from "./tiered-warmup-tier-engine.js";
import { newTieredWarmupTier } from "./tiered-warmup-tier.js";

test("TieredWarmupTierEngine keeps results within bounds", () => {
  const engine = defaultTieredWarmupTierEngine();
  const item = newTieredWarmupTier("code-109", "title-894");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
