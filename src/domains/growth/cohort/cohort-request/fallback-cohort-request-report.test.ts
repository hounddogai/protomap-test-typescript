import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackCohortRequestReport } from "./fallback-cohort-request-report.js";
import { FallbackCohortRequest, newFallbackCohortRequest } from "./fallback-cohort-request.js";

test("FallbackCohortRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_931_303);
  const items: FallbackCohortRequest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFallbackCohortRequest(`fallback-cohort-request-${index}`, "sample"));
  }
  const report = buildFallbackCohortRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
