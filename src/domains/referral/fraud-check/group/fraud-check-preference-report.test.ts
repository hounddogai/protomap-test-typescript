import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFraudCheckPreferenceReport } from "./fraud-check-preference-report.js";
import { FraudCheckPreference, newFraudCheckPreference } from "./fraud-check-preference.js";

test("FraudCheckPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_920_427);
  const items: FraudCheckPreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFraudCheckPreference(`fraud-check-preference-${index}`, "sample"));
  }
  const report = buildFraudCheckPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
