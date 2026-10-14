import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPreferenceEntryReport } from "./preference-entry-report.js";
import { PreferenceEntry, newPreferenceEntry } from "./preference-entry.js";

test("PreferenceEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_936_822);
  const items: PreferenceEntry[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPreferenceEntry(`preference-entry-${index}`, "sample"));
  }
  const report = buildPreferenceEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
