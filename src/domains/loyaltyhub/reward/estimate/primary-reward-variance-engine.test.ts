import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryRewardVarianceEngine } from "./primary-reward-variance-engine.js";
import { newPrimaryRewardVariance } from "./primary-reward-variance.js";

test("PrimaryRewardVarianceEngine keeps results within bounds", () => {
  const engine = defaultPrimaryRewardVarianceEngine(flags.newRegistry());
  const item = newPrimaryRewardVariance("code-634", "label-238");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
