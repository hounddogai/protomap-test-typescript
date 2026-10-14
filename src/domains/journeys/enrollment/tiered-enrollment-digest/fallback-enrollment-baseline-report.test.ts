import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackEnrollmentBaselineReport } from "./fallback-enrollment-baseline-report.js";
import { FallbackEnrollmentBaseline, newFallbackEnrollmentBaseline } from "./fallback-enrollment-baseline.js";

test("FallbackEnrollmentBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_042_368);
  const items: FallbackEnrollmentBaseline[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackEnrollmentBaseline(`fallback-enrollment-baseline-${index}`, "sample"));
  }
  const report = buildFallbackEnrollmentBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
