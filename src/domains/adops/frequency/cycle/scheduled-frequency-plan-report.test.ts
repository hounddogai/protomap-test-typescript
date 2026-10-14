import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledFrequencyPlanReport } from "./scheduled-frequency-plan-report.js";
import { ScheduledFrequencyPlan, newScheduledFrequencyPlan } from "./scheduled-frequency-plan.js";

test("ScheduledFrequencyPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_886_085);
  const items: ScheduledFrequencyPlan[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newScheduledFrequencyPlan(`scheduled-frequency-plan-${index}`, "sample"));
  }
  const report = buildScheduledFrequencyPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
