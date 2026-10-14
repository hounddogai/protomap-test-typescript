import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedTouchpointMilestoneReport } from "./capped-touchpoint-milestone-report.js";
import { CappedTouchpointMilestone, newCappedTouchpointMilestone } from "./capped-touchpoint-milestone.js";

test("CappedTouchpointMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_371_338);
  const items: CappedTouchpointMilestone[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedTouchpointMilestone(`capped-touchpoint-milestone-${index}`, "sample"));
  }
  const report = buildCappedTouchpointMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
