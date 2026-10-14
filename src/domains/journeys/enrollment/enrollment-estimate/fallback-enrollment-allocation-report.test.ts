import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackEnrollmentAllocationReport } from "./fallback-enrollment-allocation-report.js";
import { FallbackEnrollmentAllocation, newFallbackEnrollmentAllocation } from "./fallback-enrollment-allocation.js";

test("FallbackEnrollmentAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_314_616);
  const items: FallbackEnrollmentAllocation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackEnrollmentAllocation(`fallback-enrollment-allocation-${index}`, "sample"));
  }
  const report = buildFallbackEnrollmentAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
