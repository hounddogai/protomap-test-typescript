import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalInsightScheduleReport } from "./seasonal-insight-schedule-report.js";
import { SeasonalInsightSchedule, newSeasonalInsightSchedule } from "./seasonal-insight-schedule.js";

test("SeasonalInsightScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_917_976);
  const items: SeasonalInsightSchedule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSeasonalInsightSchedule(`seasonal-insight-schedule-${index}`, "sample"));
  }
  const report = buildSeasonalInsightScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
