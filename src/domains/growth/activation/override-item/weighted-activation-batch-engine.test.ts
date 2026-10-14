import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedActivationBatchEngine } from "./weighted-activation-batch-engine.js";
import { newWeightedActivationBatch } from "./weighted-activation-batch.js";

test("WeightedActivationBatchEngine keeps results within bounds", () => {
  const engine = defaultWeightedActivationBatchEngine(flags.newRegistry());
  const item = newWeightedActivationBatch("code-500", "name-302");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
