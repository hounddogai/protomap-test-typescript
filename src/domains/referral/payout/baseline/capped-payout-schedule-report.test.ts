import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedPayoutScheduleReport } from "./capped-payout-schedule-report.js";
import { CappedPayoutSchedule, newCappedPayoutSchedule } from "./capped-payout-schedule.js";

test("CappedPayoutScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_563_442);
  const items: CappedPayoutSchedule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCappedPayoutSchedule(`capped-payout-schedule-${index}`, "sample"));
  }
  const report = buildCappedPayoutScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
