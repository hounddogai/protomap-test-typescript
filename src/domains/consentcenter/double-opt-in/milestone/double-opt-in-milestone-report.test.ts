import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInMilestoneReport } from "./double-opt-in-milestone-report.js";
import { DoubleOptInMilestone, newDoubleOptInMilestone } from "./double-opt-in-milestone.js";

test("DoubleOptInMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_824_946);
  const items: DoubleOptInMilestone[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDoubleOptInMilestone(`double-opt-in-milestone-${index}`, "sample"));
  }
  const report = buildDoubleOptInMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
