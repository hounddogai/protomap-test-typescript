import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFraudCheckEstimateEngine } from "./fraud-check-estimate-engine.js";
import { newFraudCheckEstimate } from "./fraud-check-estimate.js";

test("FraudCheckEstimateEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckEstimateEngine();
  const item = newFraudCheckEstimate("code-932", "name-145");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
