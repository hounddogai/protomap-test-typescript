import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultProofBatchReport } from "./default-proof-batch-report.js";
import { DefaultProofBatch, newDefaultProofBatch } from "./default-proof-batch.js";

test("DefaultProofBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_654_371);
  const items: DefaultProofBatch[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDefaultProofBatch(`default-proof-batch-${index}`, "sample"));
  }
  const report = buildDefaultProofBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
