import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingWarmupMilestoneReport } from "./rolling-warmup-milestone-report.js";
import { RollingWarmupMilestone, newRollingWarmupMilestone } from "./rolling-warmup-milestone.js";

test("RollingWarmupMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_425_518);
  const items: RollingWarmupMilestone[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingWarmupMilestone(`rolling-warmup-milestone-${index}`, "sample"));
  }
  const report = buildRollingWarmupMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
