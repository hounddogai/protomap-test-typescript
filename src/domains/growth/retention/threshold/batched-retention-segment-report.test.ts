import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedRetentionSegmentReport } from "./batched-retention-segment-report.js";
import { BatchedRetentionSegment, newBatchedRetentionSegment } from "./batched-retention-segment.js";

test("BatchedRetentionSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_979_644);
  const items: BatchedRetentionSegment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedRetentionSegment(`batched-retention-segment-${index}`, "sample"));
  }
  const report = buildBatchedRetentionSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
