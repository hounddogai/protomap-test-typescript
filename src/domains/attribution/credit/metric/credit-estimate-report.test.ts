import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditEstimateReport } from "./credit-estimate-report.js";
import { CreditEstimate, newCreditEstimate } from "./credit-estimate.js";

test("CreditEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_263_794);
  const items: CreditEstimate[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCreditEstimate(`credit-estimate-${index}`, "sample"));
  }
  const report = buildCreditEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
