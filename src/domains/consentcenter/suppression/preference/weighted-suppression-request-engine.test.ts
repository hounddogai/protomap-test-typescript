import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedSuppressionRequestEngine } from "./weighted-suppression-request-engine.js";
import { newWeightedSuppressionRequest } from "./weighted-suppression-request.js";

test("WeightedSuppressionRequestEngine keeps results within bounds", () => {
  const engine = defaultWeightedSuppressionRequestEngine(flags.newRegistry());
  const item = newWeightedSuppressionRequest("code-829", "label-796");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
