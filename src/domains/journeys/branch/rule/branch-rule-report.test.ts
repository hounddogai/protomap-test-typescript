import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBranchRuleReport } from "./branch-rule-report.js";
import { BranchRule, newBranchRule } from "./branch-rule.js";

test("BranchRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_220_854);
  const items: BranchRule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBranchRule(`branch-rule-${index}`, "sample"));
  }
  const report = buildBranchRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
