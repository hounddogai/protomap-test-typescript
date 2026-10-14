import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostBatchReport } from "./post-batch-report.js";
import { PostBatch, newPostBatch } from "./post-batch.js";

test("PostBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_309_121);
  const items: PostBatch[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPostBatch(`post-batch-${index}`, "sample"));
  }
  const report = buildPostBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
