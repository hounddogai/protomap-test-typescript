import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditScheduleReport } from "./credit-schedule-report.js";
import { CreditSchedule, newCreditSchedule } from "./credit-schedule.js";

test("CreditScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_825_357);
  const items: CreditSchedule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCreditSchedule(`credit-schedule-${index}`, "sample"));
  }
  const report = buildCreditScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
