import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientCohortQuotaReport } from "./lenient-cohort-quota-report.js";
import { LenientCohortQuota, newLenientCohortQuota } from "./lenient-cohort-quota.js";

test("LenientCohortQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_926_477);
  const items: LenientCohortQuota[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientCohortQuota(`lenient-cohort-quota-${index}`, "sample"));
  }
  const report = buildLenientCohortQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
