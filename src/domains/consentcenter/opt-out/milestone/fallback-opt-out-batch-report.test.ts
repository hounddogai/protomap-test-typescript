import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackOptOutBatchReport } from "./fallback-opt-out-batch-report.js";
import { FallbackOptOutBatch, newFallbackOptOutBatch } from "./fallback-opt-out-batch.js";

test("FallbackOptOutBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_850_864);
  const items: FallbackOptOutBatch[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFallbackOptOutBatch(`fallback-opt-out-batch-${index}`, "sample"));
  }
  const report = buildFallbackOptOutBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
