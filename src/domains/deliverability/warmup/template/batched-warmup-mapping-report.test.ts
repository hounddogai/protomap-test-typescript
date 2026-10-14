import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedWarmupMappingReport } from "./batched-warmup-mapping-report.js";
import { BatchedWarmupMapping, newBatchedWarmupMapping } from "./batched-warmup-mapping.js";

test("BatchedWarmupMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_958_875);
  const items: BatchedWarmupMapping[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedWarmupMapping(`batched-warmup-mapping-${index}`, "sample"));
  }
  const report = buildBatchedWarmupMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
