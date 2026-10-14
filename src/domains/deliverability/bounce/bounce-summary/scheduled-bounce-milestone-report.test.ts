import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledBounceMilestoneReport } from "./scheduled-bounce-milestone-report.js";
import { ScheduledBounceMilestone, newScheduledBounceMilestone } from "./scheduled-bounce-milestone.js";

test("ScheduledBounceMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_001_308);
  const items: ScheduledBounceMilestone[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newScheduledBounceMilestone(`scheduled-bounce-milestone-${index}`, "sample"));
  }
  const report = buildScheduledBounceMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
