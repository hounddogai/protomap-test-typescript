import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedPathMilestoneReport } from "./capped-path-milestone-report.js";
import { CappedPathMilestone, newCappedPathMilestone } from "./capped-path-milestone.js";

test("CappedPathMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_810_890);
  const items: CappedPathMilestone[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCappedPathMilestone(`capped-path-milestone-${index}`, "sample"));
  }
  const report = buildCappedPathMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
