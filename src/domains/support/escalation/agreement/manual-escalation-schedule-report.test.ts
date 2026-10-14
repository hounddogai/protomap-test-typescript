import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualEscalationScheduleReport } from "./manual-escalation-schedule-report.js";
import { ManualEscalationSchedule, newManualEscalationSchedule } from "./manual-escalation-schedule.js";

test("ManualEscalationScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_116_214);
  const items: ManualEscalationSchedule[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newManualEscalationSchedule(`manual-escalation-schedule-${index}`, "sample"));
  }
  const report = buildManualEscalationScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
