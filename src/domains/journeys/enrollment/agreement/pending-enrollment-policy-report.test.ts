import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingEnrollmentPolicyReport } from "./pending-enrollment-policy-report.js";
import { PendingEnrollmentPolicy, newPendingEnrollmentPolicy } from "./pending-enrollment-policy.js";

test("PendingEnrollmentPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_612_327);
  const items: PendingEnrollmentPolicy[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingEnrollmentPolicy(`pending-enrollment-policy-${index}`, "sample"));
  }
  const report = buildPendingEnrollmentPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
