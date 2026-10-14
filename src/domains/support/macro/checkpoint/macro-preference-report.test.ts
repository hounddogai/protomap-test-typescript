import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMacroPreferenceReport } from "./macro-preference-report.js";
import { MacroPreference, newMacroPreference } from "./macro-preference.js";

test("MacroPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_593_173);
  const items: MacroPreference[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newMacroPreference(`macro-preference-${index}`, "sample"));
  }
  const report = buildMacroPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
