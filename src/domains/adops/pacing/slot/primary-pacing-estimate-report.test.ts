import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryPacingEstimateReport } from "./primary-pacing-estimate-report.js";
import { PrimaryPacingEstimate, newPrimaryPacingEstimate } from "./primary-pacing-estimate.js";

test("PrimaryPacingEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_686_284);
  const items: PrimaryPacingEstimate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimaryPacingEstimate(`primary-pacing-estimate-${index}`, "sample"));
  }
  const report = buildPrimaryPacingEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
