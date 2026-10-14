import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildProofScheduleReport } from "./proof-schedule-report.js";
import { ProofSchedule, newProofSchedule } from "./proof-schedule.js";

test("ProofScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_805_357);
  const items: ProofSchedule[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newProofSchedule(`proof-schedule-${index}`, "sample"));
  }
  const report = buildProofScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
