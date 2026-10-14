import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalApprovalRecordReport } from "./regional-approval-record-report.js";
import { RegionalApprovalRecord, newRegionalApprovalRecord } from "./regional-approval-record.js";

test("RegionalApprovalRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_525_710);
  const items: RegionalApprovalRecord[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRegionalApprovalRecord(`regional-approval-record-${index}`, "sample"));
  }
  const report = buildRegionalApprovalRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
