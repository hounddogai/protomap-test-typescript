import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalReplyScheduleReport } from "./regional-reply-schedule-report.js";
import { RegionalReplySchedule, newRegionalReplySchedule } from "./regional-reply-schedule.js";

test("RegionalReplyScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_228_184);
  const items: RegionalReplySchedule[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRegionalReplySchedule(`regional-reply-schedule-${index}`, "sample"));
  }
  const report = buildRegionalReplyScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
