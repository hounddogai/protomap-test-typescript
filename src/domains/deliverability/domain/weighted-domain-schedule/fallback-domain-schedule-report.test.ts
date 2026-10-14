import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackDomainScheduleReport } from "./fallback-domain-schedule-report.js";
import { FallbackDomainSchedule, newFallbackDomainSchedule } from "./fallback-domain-schedule.js";

test("FallbackDomainScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_274_656);
  const items: FallbackDomainSchedule[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackDomainSchedule(`fallback-domain-schedule-${index}`, "sample"));
  }
  const report = buildFallbackDomainScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
