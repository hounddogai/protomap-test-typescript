import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryBranchRecordReport } from "./primary-branch-record-report.js";
import { PrimaryBranchRecord, newPrimaryBranchRecord } from "./primary-branch-record.js";

test("PrimaryBranchRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_406_311);
  const items: PrimaryBranchRecord[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimaryBranchRecord(`primary-branch-record-${index}`, "sample"));
  }
  const report = buildPrimaryBranchRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
