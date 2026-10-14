import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedBranchNoticeReport } from "./batched-branch-notice-report.js";
import { BatchedBranchNotice, newBatchedBranchNotice } from "./batched-branch-notice.js";

test("BatchedBranchNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_802_875);
  const items: BatchedBranchNotice[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedBranchNotice(`batched-branch-notice-${index}`, "sample"));
  }
  const report = buildBatchedBranchNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
