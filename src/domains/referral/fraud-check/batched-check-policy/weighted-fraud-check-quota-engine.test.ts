import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedFraudCheckQuotaEngine } from "./weighted-fraud-check-quota-engine.js";
import { newWeightedFraudCheckQuota } from "./weighted-fraud-check-quota.js";

test("WeightedFraudCheckQuotaEngine keeps results within bounds", () => {
  const engine = defaultWeightedFraudCheckQuotaEngine();
  const item = newWeightedFraudCheckQuota("code-872", "label-759");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
