import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardEstimateEngine } from "./reward-estimate-engine.js";
import { newRewardEstimate } from "./reward-estimate.js";

test("RewardEstimateEngine keeps results within bounds", () => {
  const engine = defaultRewardEstimateEngine();
  const item = newRewardEstimate("code-567", "title-880");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
