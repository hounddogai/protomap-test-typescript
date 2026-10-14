import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildChallengeScheduleReport } from "./challenge-schedule-report.js";
import { ChallengeSchedule, newChallengeSchedule } from "./challenge-schedule.js";

test("ChallengeScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_968_182);
  const items: ChallengeSchedule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newChallengeSchedule(`challenge-schedule-${index}`, "sample"));
  }
  const report = buildChallengeScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
