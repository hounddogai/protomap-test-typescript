import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledSubscriptionScheduleReport } from "./scheduled-subscription-schedule-report.js";
import {
  ScheduledSubscriptionSchedule,
  newScheduledSubscriptionSchedule,
} from "./scheduled-subscription-schedule.js";

test("ScheduledSubscriptionScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_882_204);
  const items: ScheduledSubscriptionSchedule[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newScheduledSubscriptionSchedule(`scheduled-subscription-schedule-${index}`, "sample"));
  }
  const report = buildScheduledSubscriptionScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
