import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardBatchEngine } from "./reward-batch-engine.js";
import { newRewardBatch } from "./reward-batch.js";

test("RewardBatchEngine keeps results within bounds", () => {
  const engine = defaultRewardBatchEngine(flags.newRegistry());
  const item = newRewardBatch("code-972", "name-645");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
