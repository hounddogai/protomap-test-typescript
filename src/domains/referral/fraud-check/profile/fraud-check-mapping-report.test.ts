import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFraudCheckMappingReport } from "./fraud-check-mapping-report.js";
import { FraudCheckMapping, newFraudCheckMapping } from "./fraud-check-mapping.js";

test("FraudCheckMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_709_334);
  const items: FraudCheckMapping[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFraudCheckMapping(`fraud-check-mapping-${index}`, "sample"));
  }
  const report = buildFraudCheckMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
