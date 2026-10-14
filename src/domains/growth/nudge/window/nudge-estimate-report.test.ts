import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeEstimateReport } from "./nudge-estimate-report.js";
import { NudgeEstimate, newNudgeEstimate } from "./nudge-estimate.js";

test("NudgeEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_471_782);
  const items: NudgeEstimate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newNudgeEstimate(`nudge-estimate-${index}`, "sample"));
  }
  const report = buildNudgeEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
