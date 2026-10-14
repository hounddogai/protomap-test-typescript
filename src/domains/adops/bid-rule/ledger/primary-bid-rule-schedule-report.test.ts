import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryBidRuleScheduleReport } from "./primary-bid-rule-schedule-report.js";
import { PrimaryBidRuleSchedule, newPrimaryBidRuleSchedule } from "./primary-bid-rule-schedule.js";

test("PrimaryBidRuleScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_927_606);
  const items: PrimaryBidRuleSchedule[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimaryBidRuleSchedule(`primary-bid-rule-schedule-${index}`, "sample"));
  }
  const report = buildPrimaryBidRuleScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
