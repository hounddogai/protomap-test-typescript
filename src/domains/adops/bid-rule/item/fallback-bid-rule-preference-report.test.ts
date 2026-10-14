import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackBidRulePreferenceReport } from "./fallback-bid-rule-preference-report.js";
import { FallbackBidRulePreference, newFallbackBidRulePreference } from "./fallback-bid-rule-preference.js";

test("FallbackBidRulePreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_314_115);
  const items: FallbackBidRulePreference[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackBidRulePreference(`fallback-bid-rule-preference-${index}`, "sample"));
  }
  const report = buildFallbackBidRulePreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
