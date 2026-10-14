import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedEnrollmentSlotReport } from "./weighted-enrollment-slot-report.js";
import { WeightedEnrollmentSlot, newWeightedEnrollmentSlot } from "./weighted-enrollment-slot.js";

test("WeightedEnrollmentSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_164_136);
  const items: WeightedEnrollmentSlot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedEnrollmentSlot(`weighted-enrollment-slot-${index}`, "sample"));
  }
  const report = buildWeightedEnrollmentSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
