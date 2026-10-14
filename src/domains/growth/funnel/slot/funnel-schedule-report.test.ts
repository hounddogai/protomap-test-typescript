import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelScheduleReport } from "./funnel-schedule-report.js";
import { FunnelSchedule, newFunnelSchedule } from "./funnel-schedule.js";

test("FunnelScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_025_585);
  const items: FunnelSchedule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFunnelSchedule(`funnel-schedule-${index}`, "sample"));
  }
  const report = buildFunnelScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
