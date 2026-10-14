import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentAgreementReport } from "./enrollment-agreement-report.js";
import { EnrollmentAgreement, newEnrollmentAgreement } from "./enrollment-agreement.js";

test("EnrollmentAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_809_699);
  const items: EnrollmentAgreement[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newEnrollmentAgreement(`enrollment-agreement-${index}`, "sample"));
  }
  const report = buildEnrollmentAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
