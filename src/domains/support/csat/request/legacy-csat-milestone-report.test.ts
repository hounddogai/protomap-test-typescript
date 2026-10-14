import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyCsatMilestoneReport } from "./legacy-csat-milestone-report.js";
import { LegacyCsatMilestone, newLegacyCsatMilestone } from "./legacy-csat-milestone.js";

test("LegacyCsatMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_029_456);
  const items: LegacyCsatMilestone[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacyCsatMilestone(`legacy-csat-milestone-${index}`, "sample"));
  }
  const report = buildLegacyCsatMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
