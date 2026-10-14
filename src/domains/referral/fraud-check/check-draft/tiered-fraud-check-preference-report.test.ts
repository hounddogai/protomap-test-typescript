import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredFraudCheckPreferenceReport } from "./tiered-fraud-check-preference-report.js";
import { TieredFraudCheckPreference, newTieredFraudCheckPreference } from "./tiered-fraud-check-preference.js";

test("TieredFraudCheckPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_043_325);
  const items: TieredFraudCheckPreference[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredFraudCheckPreference(`tiered-fraud-check-preference-${index}`, "sample"));
  }
  const report = buildTieredFraudCheckPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
