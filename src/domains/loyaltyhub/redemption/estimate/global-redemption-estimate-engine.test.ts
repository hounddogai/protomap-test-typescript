import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalRedemptionEstimateEngine } from "./global-redemption-estimate-engine.js";
import { newGlobalRedemptionEstimate } from "./global-redemption-estimate.js";

test("GlobalRedemptionEstimateEngine keeps results within bounds", () => {
  const engine = defaultGlobalRedemptionEstimateEngine();
  const item = newGlobalRedemptionEstimate("code-926", "name-123");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
