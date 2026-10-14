import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedCreditRequestReport } from "./batched-credit-request-report.js";
import { BatchedCreditRequest, newBatchedCreditRequest } from "./batched-credit-request.js";

test("BatchedCreditRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_046_341);
  const items: BatchedCreditRequest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBatchedCreditRequest(`batched-credit-request-${index}`, "sample"));
  }
  const report = buildBatchedCreditRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
