import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReputationBatchReport } from "./reputation-batch-report.js";
import { ReputationBatch, newReputationBatch } from "./reputation-batch.js";

test("ReputationBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_136_177);
  const items: ReputationBatch[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newReputationBatch(`reputation-batch-${index}`, "sample"));
  }
  const report = buildReputationBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
