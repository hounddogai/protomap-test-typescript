import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedActivationMilestoneReport } from "./capped-activation-milestone-report.js";
import { CappedActivationMilestone, newCappedActivationMilestone } from "./capped-activation-milestone.js";

test("CappedActivationMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_012_802);
  const items: CappedActivationMilestone[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedActivationMilestone(`capped-activation-milestone-${index}`, "sample"));
  }
  const report = buildCappedActivationMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
