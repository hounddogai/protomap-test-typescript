import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalRetentionPlanReport } from "./global-retention-plan-report.js";
import { GlobalRetentionPlan, newGlobalRetentionPlan } from "./global-retention-plan.js";

test("GlobalRetentionPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_529_863);
  const items: GlobalRetentionPlan[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newGlobalRetentionPlan(`global-retention-plan-${index}`, "sample"));
  }
  const report = buildGlobalRetentionPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
