import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationPlanReport } from "./activation-plan-report.js";
import { ActivationPlan, newActivationPlan } from "./activation-plan.js";

test("ActivationPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_223_233);
  const items: ActivationPlan[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newActivationPlan(`activation-plan-${index}`, "sample"));
  }
  const report = buildActivationPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
