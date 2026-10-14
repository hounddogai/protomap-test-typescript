import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientRewardRuleMilestoneReport } from "./lenient-reward-rule-milestone-report.js";
import { LenientRewardRuleMilestone, newLenientRewardRuleMilestone } from "./lenient-reward-rule-milestone.js";

test("LenientRewardRuleMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_974_518);
  const items: LenientRewardRuleMilestone[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientRewardRuleMilestone(`lenient-reward-rule-milestone-${index}`, "sample"));
  }
  const report = buildLenientRewardRuleMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
