import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCsatScheduleReport } from "./csat-schedule-report.js";
import { CsatSchedule, newCsatSchedule } from "./csat-schedule.js";

test("CsatScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_542_654);
  const items: CsatSchedule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCsatSchedule(`csat-schedule-${index}`, "sample"));
  }
  const report = buildCsatScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
