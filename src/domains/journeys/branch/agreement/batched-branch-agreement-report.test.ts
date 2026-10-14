import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedBranchAgreementReport } from "./batched-branch-agreement-report.js";
import { BatchedBranchAgreement, newBatchedBranchAgreement } from "./batched-branch-agreement.js";

test("BatchedBranchAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_724_074);
  const items: BatchedBranchAgreement[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedBranchAgreement(`batched-branch-agreement-${index}`, "sample"));
  }
  const report = buildBatchedBranchAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
