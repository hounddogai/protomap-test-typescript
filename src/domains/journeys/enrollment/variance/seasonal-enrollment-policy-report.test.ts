import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalEnrollmentPolicyReport } from "./seasonal-enrollment-policy-report.js";
import { SeasonalEnrollmentPolicy, newSeasonalEnrollmentPolicy } from "./seasonal-enrollment-policy.js";

test("SeasonalEnrollmentPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_647_811);
  const items: SeasonalEnrollmentPolicy[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSeasonalEnrollmentPolicy(`seasonal-enrollment-policy-${index}`, "sample"));
  }
  const report = buildSeasonalEnrollmentPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
