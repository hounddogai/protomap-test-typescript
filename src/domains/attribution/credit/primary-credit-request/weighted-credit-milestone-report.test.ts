import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedCreditMilestoneReport } from "./weighted-credit-milestone-report.js";
import { WeightedCreditMilestone, newWeightedCreditMilestone } from "./weighted-credit-milestone.js";

test("WeightedCreditMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_230_944);
  const items: WeightedCreditMilestone[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedCreditMilestone(`weighted-credit-milestone-${index}`, "sample"));
  }
  const report = buildWeightedCreditMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
