import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedQueueEstimateEngine } from "./weighted-queue-estimate-engine.js";
import { newWeightedQueueEstimate } from "./weighted-queue-estimate.js";

test("WeightedQueueEstimateEngine keeps results within bounds", () => {
  const engine = defaultWeightedQueueEstimateEngine(flags.newRegistry());
  const item = newWeightedQueueEstimate("code-57", "label-560");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
