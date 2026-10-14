import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledWarmupMilestoneReport } from "./scheduled-warmup-milestone-report.js";
import { ScheduledWarmupMilestone, newScheduledWarmupMilestone } from "./scheduled-warmup-milestone.js";

test("ScheduledWarmupMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_538_920);
  const items: ScheduledWarmupMilestone[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newScheduledWarmupMilestone(`scheduled-warmup-milestone-${index}`, "sample"));
  }
  const report = buildScheduledWarmupMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
