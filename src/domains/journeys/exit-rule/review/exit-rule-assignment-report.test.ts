import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleAssignmentReport } from "./exit-rule-assignment-report.js";
import { ExitRuleAssignment, newExitRuleAssignment } from "./exit-rule-assignment.js";

test("ExitRuleAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_288_774);
  const items: ExitRuleAssignment[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newExitRuleAssignment(`exit-rule-assignment-${index}`, "sample"));
  }
  const report = buildExitRuleAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
