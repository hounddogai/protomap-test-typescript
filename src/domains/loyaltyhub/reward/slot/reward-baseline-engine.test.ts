import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardBaselineEngine } from "./reward-baseline-engine.js";
import { newRewardBaseline } from "./reward-baseline.js";

test("RewardBaselineEngine keeps results within bounds", () => {
  const engine = defaultRewardBaselineEngine();
  const item = newRewardBaseline("code-822", "label-616");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
