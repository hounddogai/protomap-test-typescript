import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentRollupReport } from "./enrollment-rollup-report.js";
import { EnrollmentRollup, newEnrollmentRollup } from "./enrollment-rollup.js";

test("EnrollmentRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_107_375);
  const items: EnrollmentRollup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newEnrollmentRollup(`enrollment-rollup-${index}`, "sample"));
  }
  const report = buildEnrollmentRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
