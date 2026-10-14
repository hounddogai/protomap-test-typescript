import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveCohortEstimateReport } from "./adaptive-cohort-estimate-report.js";
import { AdaptiveCohortEstimate, newAdaptiveCohortEstimate } from "./adaptive-cohort-estimate.js";

test("AdaptiveCohortEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_256_778);
  const items: AdaptiveCohortEstimate[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newAdaptiveCohortEstimate(`adaptive-cohort-estimate-${index}`, "sample"));
  }
  const report = buildAdaptiveCohortEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
