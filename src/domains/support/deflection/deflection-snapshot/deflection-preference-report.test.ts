import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionPreferenceReport } from "./deflection-preference-report.js";
import { DeflectionPreference, newDeflectionPreference } from "./deflection-preference.js";

test("DeflectionPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_192_469);
  const items: DeflectionPreference[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDeflectionPreference(`deflection-preference-${index}`, "sample"));
  }
  const report = buildDeflectionPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
