import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedExitRuleAssignmentReport } from "./batched-exit-rule-assignment-report.js";
import { BatchedExitRuleAssignment, newBatchedExitRuleAssignment } from "./batched-exit-rule-assignment.js";

test("BatchedExitRuleAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_534_081);
  const items: BatchedExitRuleAssignment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedExitRuleAssignment(`batched-exit-rule-assignment-${index}`, "sample"));
  }
  const report = buildBatchedExitRuleAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
