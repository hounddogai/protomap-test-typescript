import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedReputationExceptionEngine } from "./weighted-reputation-exception-engine.js";
import { newWeightedReputationException } from "./weighted-reputation-exception.js";

test("WeightedReputationExceptionEngine keeps results within bounds", () => {
  const engine = defaultWeightedReputationExceptionEngine(flags.newRegistry());
  const item = newWeightedReputationException("code-365", "label-776");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
