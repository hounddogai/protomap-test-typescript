import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredEnrollmentAgreementReport } from "./tiered-enrollment-agreement-report.js";
import { TieredEnrollmentAgreement, newTieredEnrollmentAgreement } from "./tiered-enrollment-agreement.js";

test("TieredEnrollmentAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_619_138);
  const items: TieredEnrollmentAgreement[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredEnrollmentAgreement(`tiered-enrollment-agreement-${index}`, "sample"));
  }
  const report = buildTieredEnrollmentAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
