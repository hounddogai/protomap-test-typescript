import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyPacingPlanReport } from "./legacy-pacing-plan-report.js";
import { LegacyPacingPlan, newLegacyPacingPlan } from "./legacy-pacing-plan.js";

test("LegacyPacingPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_250_190);
  const items: LegacyPacingPlan[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLegacyPacingPlan(`legacy-pacing-plan-${index}`, "sample"));
  }
  const report = buildLegacyPacingPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
