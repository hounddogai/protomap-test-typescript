import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredSubscriptionScheduleReport } from "./tiered-subscription-schedule-report.js";
import { TieredSubscriptionSchedule, newTieredSubscriptionSchedule } from "./tiered-subscription-schedule.js";

test("TieredSubscriptionScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_782_555);
  const items: TieredSubscriptionSchedule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredSubscriptionSchedule(`tiered-subscription-schedule-${index}`, "sample"));
  }
  const report = buildTieredSubscriptionScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
