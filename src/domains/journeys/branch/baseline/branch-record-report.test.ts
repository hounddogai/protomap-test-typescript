import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBranchRecordReport } from "./branch-record-report.js";
import { BranchRecord, newBranchRecord } from "./branch-record.js";

test("BranchRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_306_929);
  const items: BranchRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBranchRecord(`branch-record-${index}`, "sample"));
  }
  const report = buildBranchRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
