import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackBidRuleOverrideReport } from "./fallback-bid-rule-override-report.js";
import { FallbackBidRuleOverride, newFallbackBidRuleOverride } from "./fallback-bid-rule-override.js";

test("FallbackBidRuleOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_367_031);
  const items: FallbackBidRuleOverride[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackBidRuleOverride(`fallback-bid-rule-override-${index}`, "sample"));
  }
  const report = buildFallbackBidRuleOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
