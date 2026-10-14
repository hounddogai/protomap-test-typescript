import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedExitRuleAuditReport } from "./batched-exit-rule-audit-report.js";
import { BatchedExitRuleAudit, newBatchedExitRuleAudit } from "./batched-exit-rule-audit.js";

test("BatchedExitRuleAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_417_759);
  const items: BatchedExitRuleAudit[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedExitRuleAudit(`batched-exit-rule-audit-${index}`, "sample"));
  }
  const report = buildBatchedExitRuleAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
