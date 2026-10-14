import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingProofScheduleReport } from "./rolling-proof-schedule-report.js";
import { RollingProofSchedule, newRollingProofSchedule } from "./rolling-proof-schedule.js";

test("RollingProofScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_569_485);
  const items: RollingProofSchedule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingProofSchedule(`rolling-proof-schedule-${index}`, "sample"));
  }
  const report = buildRollingProofScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
