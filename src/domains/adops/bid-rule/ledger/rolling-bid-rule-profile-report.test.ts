import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingBidRuleProfileReport } from "./rolling-bid-rule-profile-report.js";
import { RollingBidRuleProfile, newRollingBidRuleProfile } from "./rolling-bid-rule-profile.js";

test("RollingBidRuleProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_260_511);
  const items: RollingBidRuleProfile[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRollingBidRuleProfile(`rolling-bid-rule-profile-${index}`, "sample"));
  }
  const report = buildRollingBidRuleProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
