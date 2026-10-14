import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyExitRuleScheduleReport } from "./legacy-exit-rule-schedule-report.js";
import { LegacyExitRuleSchedule, newLegacyExitRuleSchedule } from "./legacy-exit-rule-schedule.js";

test("LegacyExitRuleScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_761_820);
  const items: LegacyExitRuleSchedule[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLegacyExitRuleSchedule(`legacy-exit-rule-schedule-${index}`, "sample"));
  }
  const report = buildLegacyExitRuleScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
