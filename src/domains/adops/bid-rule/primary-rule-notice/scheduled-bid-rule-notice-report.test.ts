import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledBidRuleNoticeReport } from "./scheduled-bid-rule-notice-report.js";
import { ScheduledBidRuleNotice, newScheduledBidRuleNotice } from "./scheduled-bid-rule-notice.js";

test("ScheduledBidRuleNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_979_895);
  const items: ScheduledBidRuleNotice[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledBidRuleNotice(`scheduled-bid-rule-notice-${index}`, "sample"));
  }
  const report = buildScheduledBidRuleNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
