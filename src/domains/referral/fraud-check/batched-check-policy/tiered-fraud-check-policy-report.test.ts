import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredFraudCheckPolicyReport } from "./tiered-fraud-check-policy-report.js";
import { TieredFraudCheckPolicy, newTieredFraudCheckPolicy } from "./tiered-fraud-check-policy.js";

test("TieredFraudCheckPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_154_818);
  const items: TieredFraudCheckPolicy[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredFraudCheckPolicy(`tiered-fraud-check-policy-${index}`, "sample"));
  }
  const report = buildTieredFraudCheckPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
