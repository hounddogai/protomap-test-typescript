import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientWarmupMilestoneReport } from "./lenient-warmup-milestone-report.js";
import { LenientWarmupMilestone, newLenientWarmupMilestone } from "./lenient-warmup-milestone.js";

test("LenientWarmupMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_636_310);
  const items: LenientWarmupMilestone[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLenientWarmupMilestone(`lenient-warmup-milestone-${index}`, "sample"));
  }
  const report = buildLenientWarmupMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
