import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFrequencyBatchReport } from "./frequency-batch-report.js";
import { FrequencyBatch, newFrequencyBatch } from "./frequency-batch.js";

test("FrequencyBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_553_548);
  const items: FrequencyBatch[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFrequencyBatch(`frequency-batch-${index}`, "sample"));
  }
  const report = buildFrequencyBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
