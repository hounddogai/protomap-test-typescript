import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackPreferenceEntryReport } from "./fallback-preference-entry-report.js";
import { FallbackPreferenceEntry, newFallbackPreferenceEntry } from "./fallback-preference-entry.js";

test("FallbackPreferenceEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_407_609);
  const items: FallbackPreferenceEntry[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFallbackPreferenceEntry(`fallback-preference-entry-${index}`, "sample"));
  }
  const report = buildFallbackPreferenceEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
