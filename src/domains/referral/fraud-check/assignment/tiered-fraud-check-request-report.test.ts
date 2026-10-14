import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredFraudCheckRequestReport } from "./tiered-fraud-check-request-report.js";
import { TieredFraudCheckRequest, newTieredFraudCheckRequest } from "./tiered-fraud-check-request.js";

test("TieredFraudCheckRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_912_011);
  const items: TieredFraudCheckRequest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredFraudCheckRequest(`tiered-fraud-check-request-${index}`, "sample"));
  }
  const report = buildTieredFraudCheckRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
