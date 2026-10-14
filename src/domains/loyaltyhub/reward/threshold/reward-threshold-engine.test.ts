import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardThresholdEngine } from "./reward-threshold-engine.js";
import { newRewardThreshold } from "./reward-threshold.js";

test("RewardThresholdEngine keeps results within bounds", () => {
  const engine = defaultRewardThresholdEngine(flags.newRegistry());
  const item = newRewardThreshold("code-222", "label-540");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
