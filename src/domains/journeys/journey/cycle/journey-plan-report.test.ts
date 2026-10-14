import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildJourneyPlanReport } from "./journey-plan-report.js";
import { JourneyPlan, newJourneyPlan } from "./journey-plan.js";

test("JourneyPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_298_978);
  const items: JourneyPlan[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newJourneyPlan(`journey-plan-${index}`, "sample"));
  }
  const report = buildJourneyPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
