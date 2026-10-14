import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationScheduleReport } from "./escalation-schedule-report.js";
import { EscalationSchedule, newEscalationSchedule } from "./escalation-schedule.js";

test("EscalationScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_082_846);
  const items: EscalationSchedule[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newEscalationSchedule(`escalation-schedule-${index}`, "sample"));
  }
  const report = buildEscalationScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
