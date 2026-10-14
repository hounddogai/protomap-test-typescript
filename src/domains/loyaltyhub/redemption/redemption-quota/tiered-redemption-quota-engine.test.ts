import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredRedemptionQuotaEngine } from "./tiered-redemption-quota-engine.js";
import { newTieredRedemptionQuota } from "./tiered-redemption-quota.js";

test("TieredRedemptionQuotaEngine keeps results within bounds", () => {
  const engine = defaultTieredRedemptionQuotaEngine();
  const item = newTieredRedemptionQuota("code-970", "label-398");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
