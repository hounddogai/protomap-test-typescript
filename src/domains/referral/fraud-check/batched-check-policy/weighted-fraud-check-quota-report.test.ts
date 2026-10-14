import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedFraudCheckQuotaReport } from "./weighted-fraud-check-quota-report.js";
import { WeightedFraudCheckQuota, newWeightedFraudCheckQuota } from "./weighted-fraud-check-quota.js";

test("WeightedFraudCheckQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_997_643);
  const items: WeightedFraudCheckQuota[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedFraudCheckQuota(`weighted-fraud-check-quota-${index}`, "sample"));
  }
  const report = buildWeightedFraudCheckQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
