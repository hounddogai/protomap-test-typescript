import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeMilestoneReport } from "./nudge-milestone-report.js";
import { NudgeMilestone, newNudgeMilestone } from "./nudge-milestone.js";

test("NudgeMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_185_766);
  const items: NudgeMilestone[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newNudgeMilestone(`nudge-milestone-${index}`, "sample"));
  }
  const report = buildNudgeMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
