import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPreferenceMappingReport } from "./preference-mapping-report.js";
import { PreferenceMapping, newPreferenceMapping } from "./preference-mapping.js";

test("PreferenceMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_575_440);
  const items: PreferenceMapping[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPreferenceMapping(`preference-mapping-${index}`, "sample"));
  }
  const report = buildPreferenceMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
