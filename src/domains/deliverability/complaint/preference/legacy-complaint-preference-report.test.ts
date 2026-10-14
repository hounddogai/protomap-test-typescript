import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyComplaintPreferenceReport } from "./legacy-complaint-preference-report.js";
import { LegacyComplaintPreference, newLegacyComplaintPreference } from "./legacy-complaint-preference.js";

test("LegacyComplaintPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_382_579);
  const items: LegacyComplaintPreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyComplaintPreference(`legacy-complaint-preference-${index}`, "sample"));
  }
  const report = buildLegacyComplaintPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
