import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveFraudCheckScoreReport } from "./adaptive-fraud-check-score-report.js";
import { AdaptiveFraudCheckScore, newAdaptiveFraudCheckScore } from "./adaptive-fraud-check-score.js";

test("AdaptiveFraudCheckScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_233_382);
  const items: AdaptiveFraudCheckScore[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newAdaptiveFraudCheckScore(`adaptive-fraud-check-score-${index}`, "sample"));
  }
  const report = buildAdaptiveFraudCheckScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
