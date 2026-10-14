import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleProfileReport } from "./bid-rule-profile-report.js";
import { BidRuleProfile, newBidRuleProfile } from "./bid-rule-profile.js";

test("BidRuleProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_099_145);
  const items: BidRuleProfile[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBidRuleProfile(`bid-rule-profile-${index}`, "sample"));
  }
  const report = buildBidRuleProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
