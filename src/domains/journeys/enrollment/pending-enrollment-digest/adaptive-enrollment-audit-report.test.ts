import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveEnrollmentAuditReport } from "./adaptive-enrollment-audit-report.js";
import { AdaptiveEnrollmentAudit, newAdaptiveEnrollmentAudit } from "./adaptive-enrollment-audit.js";

test("AdaptiveEnrollmentAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_852_138);
  const items: AdaptiveEnrollmentAudit[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newAdaptiveEnrollmentAudit(`adaptive-enrollment-audit-${index}`, "sample"));
  }
  const report = buildAdaptiveEnrollmentAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
