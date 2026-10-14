import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredApprovalBatchReport } from "./tiered-approval-batch-report.js";
import { TieredApprovalBatch, newTieredApprovalBatch } from "./tiered-approval-batch.js";

test("TieredApprovalBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_130_791);
  const items: TieredApprovalBatch[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredApprovalBatch(`tiered-approval-batch-${index}`, "sample"));
  }
  const report = buildTieredApprovalBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
