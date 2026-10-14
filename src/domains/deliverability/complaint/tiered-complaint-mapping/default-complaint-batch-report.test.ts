import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultComplaintBatchReport } from "./default-complaint-batch-report.js";
import { DefaultComplaintBatch, newDefaultComplaintBatch } from "./default-complaint-batch.js";

test("DefaultComplaintBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_366_379);
  const items: DefaultComplaintBatch[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultComplaintBatch(`default-complaint-batch-${index}`, "sample"));
  }
  const report = buildDefaultComplaintBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
