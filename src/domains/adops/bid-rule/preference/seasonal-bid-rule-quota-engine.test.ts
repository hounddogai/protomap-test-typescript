import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalBidRuleQuotaEngine } from "./seasonal-bid-rule-quota-engine.js";
import { newSeasonalBidRuleQuota } from "./seasonal-bid-rule-quota.js";

test("SeasonalBidRuleQuotaEngine keeps results within bounds", () => {
  const engine = defaultSeasonalBidRuleQuotaEngine();
  const item = newSeasonalBidRuleQuota("code-773", "title-527");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
