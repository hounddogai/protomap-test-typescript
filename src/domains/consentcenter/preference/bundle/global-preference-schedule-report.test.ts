import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalPreferenceScheduleReport } from "./global-preference-schedule-report.js";
import { GlobalPreferenceSchedule, newGlobalPreferenceSchedule } from "./global-preference-schedule.js";

test("GlobalPreferenceScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_463_949);
  const items: GlobalPreferenceSchedule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newGlobalPreferenceSchedule(`global-preference-schedule-${index}`, "sample"));
  }
  const report = buildGlobalPreferenceScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
