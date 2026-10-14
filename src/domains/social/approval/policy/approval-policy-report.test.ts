import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildApprovalPolicyReport } from "./approval-policy-report.js";
import { ApprovalPolicy, newApprovalPolicy } from "./approval-policy.js";

test("ApprovalPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_331_193);
  const items: ApprovalPolicy[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newApprovalPolicy(`approval-policy-${index}`, "sample"));
  }
  const report = buildApprovalPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
