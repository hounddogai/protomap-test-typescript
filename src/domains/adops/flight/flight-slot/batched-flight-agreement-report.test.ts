import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedFlightAgreementReport } from "./batched-flight-agreement-report.js";
import { BatchedFlightAgreement, newBatchedFlightAgreement } from "./batched-flight-agreement.js";

test("BatchedFlightAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_620_044);
  const items: BatchedFlightAgreement[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedFlightAgreement(`batched-flight-agreement-${index}`, "sample"));
  }
  const report = buildBatchedFlightAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
