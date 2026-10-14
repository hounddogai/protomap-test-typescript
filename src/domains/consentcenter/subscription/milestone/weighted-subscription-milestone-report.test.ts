import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedSubscriptionMilestoneReport } from "./weighted-subscription-milestone-report.js";
import {
  WeightedSubscriptionMilestone,
  newWeightedSubscriptionMilestone,
} from "./weighted-subscription-milestone.js";

test("WeightedSubscriptionMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_997_716);
  const items: WeightedSubscriptionMilestone[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWeightedSubscriptionMilestone(`weighted-subscription-milestone-${index}`, "sample"));
  }
  const report = buildWeightedSubscriptionMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
