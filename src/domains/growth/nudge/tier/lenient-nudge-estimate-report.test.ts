import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientNudgeEstimateReport } from "./lenient-nudge-estimate-report.js";
import { LenientNudgeEstimate, newLenientNudgeEstimate } from "./lenient-nudge-estimate.js";

test("LenientNudgeEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_287_451);
  const items: LenientNudgeEstimate[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLenientNudgeEstimate(`lenient-nudge-estimate-${index}`, "sample"));
  }
  const report = buildLenientNudgeEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
