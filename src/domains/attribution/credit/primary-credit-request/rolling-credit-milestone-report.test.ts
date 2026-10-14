import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingCreditMilestoneReport } from "./rolling-credit-milestone-report.js";
import { RollingCreditMilestone, newRollingCreditMilestone } from "./rolling-credit-milestone.js";

test("RollingCreditMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_653_397);
  const items: RollingCreditMilestone[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRollingCreditMilestone(`rolling-credit-milestone-${index}`, "sample"));
  }
  const report = buildRollingCreditMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
