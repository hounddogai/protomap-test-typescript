import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackCreditPreferenceReport } from "./fallback-credit-preference-report.js";
import { FallbackCreditPreference, newFallbackCreditPreference } from "./fallback-credit-preference.js";

test("FallbackCreditPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_719_497);
  const items: FallbackCreditPreference[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackCreditPreference(`fallback-credit-preference-${index}`, "sample"));
  }
  const report = buildFallbackCreditPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
