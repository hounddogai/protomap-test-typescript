import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalEnrollmentSlotReport } from "./global-enrollment-slot-report.js";
import { GlobalEnrollmentSlot, newGlobalEnrollmentSlot } from "./global-enrollment-slot.js";

test("GlobalEnrollmentSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_372_868);
  const items: GlobalEnrollmentSlot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalEnrollmentSlot(`global-enrollment-slot-${index}`, "sample"));
  }
  const report = buildGlobalEnrollmentSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
