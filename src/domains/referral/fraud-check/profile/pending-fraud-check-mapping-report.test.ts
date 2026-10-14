import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingFraudCheckMappingReport } from "./pending-fraud-check-mapping-report.js";
import { PendingFraudCheckMapping, newPendingFraudCheckMapping } from "./pending-fraud-check-mapping.js";

test("PendingFraudCheckMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_865_923);
  const items: PendingFraudCheckMapping[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPendingFraudCheckMapping(`pending-fraud-check-mapping-${index}`, "sample"));
  }
  const report = buildPendingFraudCheckMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
