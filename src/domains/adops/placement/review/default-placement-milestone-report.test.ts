import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultPlacementMilestoneReport } from "./default-placement-milestone-report.js";
import { DefaultPlacementMilestone, newDefaultPlacementMilestone } from "./default-placement-milestone.js";

test("DefaultPlacementMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_192_278);
  const items: DefaultPlacementMilestone[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDefaultPlacementMilestone(`default-placement-milestone-${index}`, "sample"));
  }
  const report = buildDefaultPlacementMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
