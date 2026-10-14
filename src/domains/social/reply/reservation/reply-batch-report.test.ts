import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyBatchReport } from "./reply-batch-report.js";
import { ReplyBatch, newReplyBatch } from "./reply-batch.js";

test("ReplyBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_432_668);
  const items: ReplyBatch[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newReplyBatch(`reply-batch-${index}`, "sample"));
  }
  const report = buildReplyBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
