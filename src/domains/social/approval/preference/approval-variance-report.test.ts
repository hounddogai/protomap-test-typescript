import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildApprovalVarianceReport } from "./approval-variance-report.js";
import { ApprovalVariance, newApprovalVariance } from "./approval-variance.js";

test("ApprovalVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_510_797);
  const items: ApprovalVariance[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newApprovalVariance(`approval-variance-${index}`, "sample"));
  }
  const report = buildApprovalVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
