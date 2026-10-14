import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedPayoutQuotaEngine } from "./capped-payout-quota-engine.js";
import { newCappedPayoutQuota } from "./capped-payout-quota.js";

test("CappedPayoutQuotaEngine keeps results within bounds", () => {
  const engine = defaultCappedPayoutQuotaEngine();
  const item = newCappedPayoutQuota("code-345", "label-172");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
