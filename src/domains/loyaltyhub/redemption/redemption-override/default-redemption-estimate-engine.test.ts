import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultRedemptionEstimateEngine } from "./default-redemption-estimate-engine.js";
import { newDefaultRedemptionEstimate } from "./default-redemption-estimate.js";

test("DefaultRedemptionEstimateEngine keeps results within bounds", () => {
  const engine = defaultDefaultRedemptionEstimateEngine();
  const item = newDefaultRedemptionEstimate("code-748", "title-401");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
