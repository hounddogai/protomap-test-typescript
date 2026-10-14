import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedFraudCheckMappingEngine } from "./weighted-fraud-check-mapping-engine.js";
import { newWeightedFraudCheckMapping } from "./weighted-fraud-check-mapping.js";

test("WeightedFraudCheckMappingEngine keeps results within bounds", () => {
  const engine = defaultWeightedFraudCheckMappingEngine();
  const item = newWeightedFraudCheckMapping("code-322", "name-536");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
