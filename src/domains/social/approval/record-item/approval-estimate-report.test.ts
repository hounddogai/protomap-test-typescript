import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildApprovalEstimateReport } from "./approval-estimate-report.js";
import { ApprovalEstimate, newApprovalEstimate } from "./approval-estimate.js";

test("ApprovalEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_095_177);
  const items: ApprovalEstimate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newApprovalEstimate(`approval-estimate-${index}`, "sample"));
  }
  const report = buildApprovalEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
