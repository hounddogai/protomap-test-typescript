import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentSlotReport } from "./enrollment-slot-report.js";
import { EnrollmentSlot, newEnrollmentSlot } from "./enrollment-slot.js";

test("EnrollmentSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_845_265);
  const items: EnrollmentSlot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newEnrollmentSlot(`enrollment-slot-${index}`, "sample"));
  }
  const report = buildEnrollmentSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
