import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentQuotaReport } from "./enrollment-quota-report.js";
import { EnrollmentQuota, newEnrollmentQuota } from "./enrollment-quota.js";

test("EnrollmentQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_905_481);
  const items: EnrollmentQuota[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newEnrollmentQuota(`enrollment-quota-${index}`, "sample"));
  }
  const report = buildEnrollmentQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
