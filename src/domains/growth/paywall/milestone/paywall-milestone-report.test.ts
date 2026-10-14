import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPaywallMilestoneReport } from "./paywall-milestone-report.js";
import { PaywallMilestone, newPaywallMilestone } from "./paywall-milestone.js";

test("PaywallMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_850_867);
  const items: PaywallMilestone[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPaywallMilestone(`paywall-milestone-${index}`, "sample"));
  }
  const report = buildPaywallMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
