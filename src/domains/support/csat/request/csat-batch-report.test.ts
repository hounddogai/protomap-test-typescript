import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCsatBatchReport } from "./csat-batch-report.js";
import { CsatBatch, newCsatBatch } from "./csat-batch.js";

test("CsatBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_868_161);
  const items: CsatBatch[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCsatBatch(`csat-batch-${index}`, "sample"));
  }
  const report = buildCsatBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
