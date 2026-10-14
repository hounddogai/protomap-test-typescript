import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveRedemptionQuotaEngine } from "./adaptive-redemption-quota-engine.js";
import { newAdaptiveRedemptionQuota } from "./adaptive-redemption-quota.js";

test("AdaptiveRedemptionQuotaEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveRedemptionQuotaEngine();
  const item = newAdaptiveRedemptionQuota("code-684", "label-790");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
