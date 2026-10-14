import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedFraudCheckExceptionReport } from "./capped-fraud-check-exception-report.js";
import { CappedFraudCheckException, newCappedFraudCheckException } from "./capped-fraud-check-exception.js";

test("CappedFraudCheckExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_830_740);
  const items: CappedFraudCheckException[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedFraudCheckException(`capped-fraud-check-exception-${index}`, "sample"));
  }
  const report = buildCappedFraudCheckExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
