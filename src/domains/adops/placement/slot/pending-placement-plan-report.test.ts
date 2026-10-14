import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingPlacementPlanReport } from "./pending-placement-plan-report.js";
import { PendingPlacementPlan, newPendingPlacementPlan } from "./pending-placement-plan.js";

test("PendingPlacementPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_682_051);
  const items: PendingPlacementPlan[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPendingPlacementPlan(`pending-placement-plan-${index}`, "sample"));
  }
  const report = buildPendingPlacementPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
