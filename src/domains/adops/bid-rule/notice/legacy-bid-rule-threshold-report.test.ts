import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyBidRuleThresholdReport } from "./legacy-bid-rule-threshold-report.js";
import { LegacyBidRuleThreshold, newLegacyBidRuleThreshold } from "./legacy-bid-rule-threshold.js";

test("LegacyBidRuleThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_886_944);
  const items: LegacyBidRuleThreshold[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacyBidRuleThreshold(`legacy-bid-rule-threshold-${index}`, "sample"));
  }
  const report = buildLegacyBidRuleThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
