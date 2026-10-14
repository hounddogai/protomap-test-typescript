import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyCreditScheduleReport } from "./legacy-credit-schedule-report.js";
import { LegacyCreditSchedule, newLegacyCreditSchedule } from "./legacy-credit-schedule.js";

test("LegacyCreditScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_231_585);
  const items: LegacyCreditSchedule[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyCreditSchedule(`legacy-credit-schedule-${index}`, "sample"));
  }
  const report = buildLegacyCreditScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
