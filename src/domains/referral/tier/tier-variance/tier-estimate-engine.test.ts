import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierEstimateEngine } from "./tier-estimate-engine.js";
import { newTierEstimate } from "./tier-estimate.js";

test("TierEstimateEngine keeps results within bounds", () => {
  const engine = defaultTierEstimateEngine(flags.newRegistry());
  const item = newTierEstimate("code-574", "name-373");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
