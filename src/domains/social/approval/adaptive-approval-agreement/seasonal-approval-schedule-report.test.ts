import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalApprovalScheduleReport } from "./seasonal-approval-schedule-report.js";
import { SeasonalApprovalSchedule, newSeasonalApprovalSchedule } from "./seasonal-approval-schedule.js";

test("SeasonalApprovalScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_530_915);
  const items: SeasonalApprovalSchedule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSeasonalApprovalSchedule(`seasonal-approval-schedule-${index}`, "sample"));
  }
  const report = buildSeasonalApprovalScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
