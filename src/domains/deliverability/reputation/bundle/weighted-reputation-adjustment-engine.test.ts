import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedReputationAdjustmentEngine } from "./weighted-reputation-adjustment-engine.js";
import { newWeightedReputationAdjustment } from "./weighted-reputation-adjustment.js";

test("WeightedReputationAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultWeightedReputationAdjustmentEngine();
  const item = newWeightedReputationAdjustment("code-679", "name-89");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
