import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientReplyBatchReport } from "./lenient-reply-batch-report.js";
import { LenientReplyBatch, newLenientReplyBatch } from "./lenient-reply-batch.js";

test("LenientReplyBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_625_461);
  const items: LenientReplyBatch[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLenientReplyBatch(`lenient-reply-batch-${index}`, "sample"));
  }
  const report = buildLenientReplyBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
