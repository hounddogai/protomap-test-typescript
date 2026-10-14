import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictDomainScheduleReport } from "./strict-domain-schedule-report.js";
import { StrictDomainSchedule, newStrictDomainSchedule } from "./strict-domain-schedule.js";

test("StrictDomainScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_183_353);
  const items: StrictDomainSchedule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStrictDomainSchedule(`strict-domain-schedule-${index}`, "sample"));
  }
  const report = buildStrictDomainScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
