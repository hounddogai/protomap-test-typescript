import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedFraudCheckMappingReport } from "./weighted-fraud-check-mapping-report.js";
import { WeightedFraudCheckMapping, newWeightedFraudCheckMapping } from "./weighted-fraud-check-mapping.js";

test("WeightedFraudCheckMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_156_240);
  const items: WeightedFraudCheckMapping[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedFraudCheckMapping(`weighted-fraud-check-mapping-${index}`, "sample"));
  }
  const report = buildWeightedFraudCheckMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
