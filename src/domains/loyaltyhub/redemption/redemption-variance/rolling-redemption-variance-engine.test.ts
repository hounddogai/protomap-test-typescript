import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingRedemptionVarianceEngine } from "./rolling-redemption-variance-engine.js";
import { newRollingRedemptionVariance } from "./rolling-redemption-variance.js";

test("RollingRedemptionVarianceEngine keeps results within bounds", () => {
  const engine = defaultRollingRedemptionVarianceEngine();
  const item = newRollingRedemptionVariance("code-889", "name-554");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
