import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingFraudCheckExceptionReport } from "./pending-fraud-check-exception-report.js";
import { PendingFraudCheckException, newPendingFraudCheckException } from "./pending-fraud-check-exception.js";

test("PendingFraudCheckExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_425_417);
  const items: PendingFraudCheckException[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPendingFraudCheckException(`pending-fraud-check-exception-${index}`, "sample"));
  }
  const report = buildPendingFraudCheckExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
