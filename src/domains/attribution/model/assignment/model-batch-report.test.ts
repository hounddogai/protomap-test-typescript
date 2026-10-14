import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelBatchReport } from "./model-batch-report.js";
import { ModelBatch, newModelBatch } from "./model-batch.js";

test("ModelBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_425_060);
  const items: ModelBatch[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newModelBatch(`model-batch-${index}`, "sample"));
  }
  const report = buildModelBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
