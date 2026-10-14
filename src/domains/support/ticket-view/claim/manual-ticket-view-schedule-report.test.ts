import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualTicketViewScheduleReport } from "./manual-ticket-view-schedule-report.js";
import { ManualTicketViewSchedule, newManualTicketViewSchedule } from "./manual-ticket-view-schedule.js";

test("ManualTicketViewScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_800_452);
  const items: ManualTicketViewSchedule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newManualTicketViewSchedule(`manual-ticket-view-schedule-${index}`, "sample"));
  }
  const report = buildManualTicketViewScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
