import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedSlaScheduleReport } from "./capped-sla-schedule-report.js";
import { CappedSlaSchedule, newCappedSlaSchedule } from "./capped-sla-schedule.js";

test("CappedSlaScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_302_714);
  const items: CappedSlaSchedule[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedSlaSchedule(`capped-sla-schedule-${index}`, "sample"));
  }
  const report = buildCappedSlaScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
