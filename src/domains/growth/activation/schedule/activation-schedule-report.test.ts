import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationScheduleReport } from "./activation-schedule-report.js";
import { ActivationSchedule, newActivationSchedule } from "./activation-schedule.js";

test("ActivationScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_734_695);
  const items: ActivationSchedule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newActivationSchedule(`activation-schedule-${index}`, "sample"));
  }
  const report = buildActivationScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
