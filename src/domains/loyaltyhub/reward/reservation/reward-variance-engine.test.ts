import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardVarianceEngine } from "./reward-variance-engine.js";
import { newRewardVariance } from "./reward-variance.js";

test("RewardVarianceEngine keeps results within bounds", () => {
  const engine = defaultRewardVarianceEngine(flags.newRegistry());
  const item = newRewardVariance("code-918", "label-566");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
