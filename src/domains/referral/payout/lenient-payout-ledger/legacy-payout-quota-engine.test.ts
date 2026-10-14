import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyPayoutQuotaEngine } from "./legacy-payout-quota-engine.js";
import { newLegacyPayoutQuota } from "./legacy-payout-quota.js";

test("LegacyPayoutQuotaEngine keeps results within bounds", () => {
  const engine = defaultLegacyPayoutQuotaEngine(flags.newRegistry());
  const item = newLegacyPayoutQuota("code-422", "title-504");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
