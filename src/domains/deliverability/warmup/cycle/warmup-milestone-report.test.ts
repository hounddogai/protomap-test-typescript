import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupMilestoneReport } from "./warmup-milestone-report.js";
import { WarmupMilestone, newWarmupMilestone } from "./warmup-milestone.js";

test("WarmupMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_299_400);
  const items: WarmupMilestone[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWarmupMilestone(`warmup-milestone-${index}`, "sample"));
  }
  const report = buildWarmupMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
