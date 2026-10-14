import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedEscalationVarianceEngine } from "./weighted-escalation-variance-engine.js";
import { newWeightedEscalationVariance } from "./weighted-escalation-variance.js";

test("WeightedEscalationVarianceEngine keeps results within bounds", () => {
  const engine = defaultWeightedEscalationVarianceEngine();
  const item = newWeightedEscalationVariance("code-461", "label-53");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
