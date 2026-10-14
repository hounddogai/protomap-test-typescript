import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentPreferenceReport } from "./enrollment-preference-report.js";
import { EnrollmentPreference, newEnrollmentPreference } from "./enrollment-preference.js";

test("EnrollmentPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_827_555);
  const items: EnrollmentPreference[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newEnrollmentPreference(`enrollment-preference-${index}`, "sample"));
  }
  const report = buildEnrollmentPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
