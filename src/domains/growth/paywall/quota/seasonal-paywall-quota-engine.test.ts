import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalPaywallQuotaEngine } from "./seasonal-paywall-quota-engine.js";
import { newSeasonalPaywallQuota } from "./seasonal-paywall-quota.js";

test("SeasonalPaywallQuotaEngine keeps results within bounds", () => {
  const engine = defaultSeasonalPaywallQuotaEngine();
  const item = newSeasonalPaywallQuota("code-607", "label-409");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
