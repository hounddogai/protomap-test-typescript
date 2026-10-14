import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacySubscriptionMilestoneReport } from "./legacy-subscription-milestone-report.js";
import { LegacySubscriptionMilestone, newLegacySubscriptionMilestone } from "./legacy-subscription-milestone.js";

test("LegacySubscriptionMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_213_324);
  const items: LegacySubscriptionMilestone[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLegacySubscriptionMilestone(`legacy-subscription-milestone-${index}`, "sample"));
  }
  const report = buildLegacySubscriptionMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
