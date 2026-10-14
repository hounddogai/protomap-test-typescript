import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackPayoutQuotaEngine } from "./fallback-payout-quota-engine.js";
import { newFallbackPayoutQuota } from "./fallback-payout-quota.js";

test("FallbackPayoutQuotaEngine keeps results within bounds", () => {
  const engine = defaultFallbackPayoutQuotaEngine();
  const item = newFallbackPayoutQuota("code-88", "name-768");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
