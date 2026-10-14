import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointMilestoneReport } from "./touchpoint-milestone-report.js";
import { TouchpointMilestone, newTouchpointMilestone } from "./touchpoint-milestone.js";

test("TouchpointMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_784_792);
  const items: TouchpointMilestone[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTouchpointMilestone(`touchpoint-milestone-${index}`, "sample"));
  }
  const report = buildTouchpointMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
