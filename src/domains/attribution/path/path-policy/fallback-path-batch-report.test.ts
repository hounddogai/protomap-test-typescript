import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackPathBatchReport } from "./fallback-path-batch-report.js";
import { FallbackPathBatch, newFallbackPathBatch } from "./fallback-path-batch.js";

test("FallbackPathBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_692_387);
  const items: FallbackPathBatch[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackPathBatch(`fallback-path-batch-${index}`, "sample"));
  }
  const report = buildFallbackPathBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
