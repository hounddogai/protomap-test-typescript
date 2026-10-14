import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedQueueAgreementReport } from "./batched-queue-agreement-report.js";
import { BatchedQueueAgreement, newBatchedQueueAgreement } from "./batched-queue-agreement.js";

test("BatchedQueueAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_613_799);
  const items: BatchedQueueAgreement[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedQueueAgreement(`batched-queue-agreement-${index}`, "sample"));
  }
  const report = buildBatchedQueueAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
