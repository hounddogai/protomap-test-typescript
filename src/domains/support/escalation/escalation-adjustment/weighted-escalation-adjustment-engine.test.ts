import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedEscalationAdjustmentEngine } from "./weighted-escalation-adjustment-engine.js";
import { newWeightedEscalationAdjustment } from "./weighted-escalation-adjustment.js";

test("WeightedEscalationAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultWeightedEscalationAdjustmentEngine();
  const item = newWeightedEscalationAdjustment("code-279", "label-559");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
