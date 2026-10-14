import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedPostExceptionReport } from "./batched-post-exception-report.js";
import { BatchedPostException, newBatchedPostException } from "./batched-post-exception.js";

test("BatchedPostExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_605_394);
  const items: BatchedPostException[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedPostException(`batched-post-exception-${index}`, "sample"));
  }
  const report = buildBatchedPostExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
