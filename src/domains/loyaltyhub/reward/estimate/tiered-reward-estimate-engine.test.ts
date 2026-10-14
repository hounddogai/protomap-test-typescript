import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredRewardEstimateEngine } from "./tiered-reward-estimate-engine.js";
import { newTieredRewardEstimate } from "./tiered-reward-estimate.js";

test("TieredRewardEstimateEngine keeps results within bounds", () => {
  const engine = defaultTieredRewardEstimateEngine(flags.newRegistry());
  const item = newTieredRewardEstimate("code-92", "label-742");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
