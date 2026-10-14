import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredStepTierEngine } from "./tiered-step-tier-engine.js";
import { newTieredStepTier } from "./tiered-step-tier.js";

test("TieredStepTierEngine keeps results within bounds", () => {
  const engine = defaultTieredStepTierEngine(flags.newRegistry());
  const item = newTieredStepTier("code-724", "name-891");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
