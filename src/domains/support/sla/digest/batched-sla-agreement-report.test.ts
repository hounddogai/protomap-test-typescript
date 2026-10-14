import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedSlaAgreementReport } from "./batched-sla-agreement-report.js";
import { BatchedSlaAgreement, newBatchedSlaAgreement } from "./batched-sla-agreement.js";

test("BatchedSlaAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_515_651);
  const items: BatchedSlaAgreement[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedSlaAgreement(`batched-sla-agreement-${index}`, "sample"));
  }
  const report = buildBatchedSlaAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
