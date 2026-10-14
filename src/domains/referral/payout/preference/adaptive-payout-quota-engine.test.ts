import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptivePayoutQuotaEngine } from "./adaptive-payout-quota-engine.js";
import { newAdaptivePayoutQuota } from "./adaptive-payout-quota.js";

test("AdaptivePayoutQuotaEngine keeps results within bounds", () => {
  const engine = defaultAdaptivePayoutQuotaEngine(flags.newRegistry());
  const item = newAdaptivePayoutQuota("code-525", "label-341");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
