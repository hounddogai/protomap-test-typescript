import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildOptOutPlanReport } from "./opt-out-plan-report.js";
import { OptOutPlan, newOptOutPlan } from "./opt-out-plan.js";

test("OptOutPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_443_495);
  const items: OptOutPlan[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newOptOutPlan(`opt-out-plan-${index}`, "sample"));
  }
  const report = buildOptOutPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
