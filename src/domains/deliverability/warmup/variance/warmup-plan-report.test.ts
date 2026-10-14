import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupPlanReport } from "./warmup-plan-report.js";
import { WarmupPlan, newWarmupPlan } from "./warmup-plan.js";

test("WarmupPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_159_907);
  const items: WarmupPlan[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWarmupPlan(`warmup-plan-${index}`, "sample"));
  }
  const report = buildWarmupPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
