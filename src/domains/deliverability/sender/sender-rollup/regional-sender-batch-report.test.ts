import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalSenderBatchReport } from "./regional-sender-batch-report.js";
import { RegionalSenderBatch, newRegionalSenderBatch } from "./regional-sender-batch.js";

test("RegionalSenderBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_897_600);
  const items: RegionalSenderBatch[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRegionalSenderBatch(`regional-sender-batch-${index}`, "sample"));
  }
  const report = buildRegionalSenderBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
