import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFraudCheckEstimateReport } from "./fraud-check-estimate-report.js";
import { FraudCheckEstimate, newFraudCheckEstimate } from "./fraud-check-estimate.js";

test("FraudCheckEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_113_670);
  const items: FraudCheckEstimate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFraudCheckEstimate(`fraud-check-estimate-${index}`, "sample"));
  }
  const report = buildFraudCheckEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
