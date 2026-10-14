import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultRetentionBatchReport } from "./default-retention-batch-report.js";
import { DefaultRetentionBatch, newDefaultRetentionBatch } from "./default-retention-batch.js";

test("DefaultRetentionBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_074_452);
  const items: DefaultRetentionBatch[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultRetentionBatch(`default-retention-batch-${index}`, "sample"));
  }
  const report = buildDefaultRetentionBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
