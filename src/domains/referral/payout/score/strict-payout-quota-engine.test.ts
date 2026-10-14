import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictPayoutQuotaEngine } from "./strict-payout-quota-engine.js";
import { newStrictPayoutQuota } from "./strict-payout-quota.js";

test("StrictPayoutQuotaEngine keeps results within bounds", () => {
  const engine = defaultStrictPayoutQuotaEngine();
  const item = newStrictPayoutQuota("code-338", "title-349");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
