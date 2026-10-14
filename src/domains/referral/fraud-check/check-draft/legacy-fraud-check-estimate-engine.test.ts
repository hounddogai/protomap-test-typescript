import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyFraudCheckEstimateEngine } from "./legacy-fraud-check-estimate-engine.js";
import { newLegacyFraudCheckEstimate } from "./legacy-fraud-check-estimate.js";

test("LegacyFraudCheckEstimateEngine keeps results within bounds", () => {
  const engine = defaultLegacyFraudCheckEstimateEngine();
  const item = newLegacyFraudCheckEstimate("code-27", "name-408");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
