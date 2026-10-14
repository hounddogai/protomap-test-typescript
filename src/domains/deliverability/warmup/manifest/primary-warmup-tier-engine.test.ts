import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryWarmupTierEngine } from "./primary-warmup-tier-engine.js";
import { newPrimaryWarmupTier } from "./primary-warmup-tier.js";

test("PrimaryWarmupTierEngine keeps results within bounds", () => {
  const engine = defaultPrimaryWarmupTierEngine(flags.newRegistry());
  const item = newPrimaryWarmupTier("code-759", "label-206");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
