import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalBranchMilestoneReport } from "./global-branch-milestone-report.js";
import { GlobalBranchMilestone, newGlobalBranchMilestone } from "./global-branch-milestone.js";

test("GlobalBranchMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_211_182);
  const items: GlobalBranchMilestone[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newGlobalBranchMilestone(`global-branch-milestone-${index}`, "sample"));
  }
  const report = buildGlobalBranchMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
