import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedConversionRecordReport } from "./batched-conversion-record-report.js";
import { BatchedConversionRecord, newBatchedConversionRecord } from "./batched-conversion-record.js";

test("BatchedConversionRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_623_958);
  const items: BatchedConversionRecord[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedConversionRecord(`batched-conversion-record-${index}`, "sample"));
  }
  const report = buildBatchedConversionRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
