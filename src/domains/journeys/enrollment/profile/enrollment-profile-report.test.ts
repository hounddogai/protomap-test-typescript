import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentProfileReport } from "./enrollment-profile-report.js";
import { EnrollmentProfile, newEnrollmentProfile } from "./enrollment-profile.js";

test("EnrollmentProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_839_157);
  const items: EnrollmentProfile[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newEnrollmentProfile(`enrollment-profile-${index}`, "sample"));
  }
  const report = buildEnrollmentProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
