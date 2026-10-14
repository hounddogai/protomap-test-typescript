import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimarySenderPlanReport } from "./primary-sender-plan-report.js";
import { PrimarySenderPlan, newPrimarySenderPlan } from "./primary-sender-plan.js";

test("PrimarySenderPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_417_987);
  const items: PrimarySenderPlan[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimarySenderPlan(`primary-sender-plan-${index}`, "sample"));
  }
  const report = buildPrimarySenderPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
