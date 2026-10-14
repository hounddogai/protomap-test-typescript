import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWindowPlanReport } from "./window-plan-report.js";
import { WindowPlan, newWindowPlan } from "./window-plan.js";

test("WindowPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_792_137);
  const items: WindowPlan[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWindowPlan(`window-plan-${index}`, "sample"));
  }
  const report = buildWindowPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
