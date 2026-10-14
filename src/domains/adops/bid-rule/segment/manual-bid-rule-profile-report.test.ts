import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualBidRuleProfileReport } from "./manual-bid-rule-profile-report.js";
import { ManualBidRuleProfile, newManualBidRuleProfile } from "./manual-bid-rule-profile.js";

test("ManualBidRuleProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_595_159);
  const items: ManualBidRuleProfile[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualBidRuleProfile(`manual-bid-rule-profile-${index}`, "sample"));
  }
  const report = buildManualBidRuleProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
