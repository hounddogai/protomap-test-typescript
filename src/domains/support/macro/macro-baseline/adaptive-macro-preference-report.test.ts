import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveMacroPreferenceReport } from "./adaptive-macro-preference-report.js";
import { AdaptiveMacroPreference, newAdaptiveMacroPreference } from "./adaptive-macro-preference.js";

test("AdaptiveMacroPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_780_419);
  const items: AdaptiveMacroPreference[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newAdaptiveMacroPreference(`adaptive-macro-preference-${index}`, "sample"));
  }
  const report = buildAdaptiveMacroPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
