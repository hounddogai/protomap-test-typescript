import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPacingEstimateReport } from "./pacing-estimate-report.js";
import { PacingEstimate, newPacingEstimate } from "./pacing-estimate.js";

test("PacingEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_755_375);
  const items: PacingEstimate[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPacingEstimate(`pacing-estimate-${index}`, "sample"));
  }
  const report = buildPacingEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
