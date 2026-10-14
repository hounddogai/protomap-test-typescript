import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredModelTierEngine } from "./tiered-model-tier-engine.js";
import { newTieredModelTier } from "./tiered-model-tier.js";

test("TieredModelTierEngine keeps results within bounds", () => {
  const engine = defaultTieredModelTierEngine(flags.newRegistry());
  const item = newTieredModelTier("code-53", "name-235");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
