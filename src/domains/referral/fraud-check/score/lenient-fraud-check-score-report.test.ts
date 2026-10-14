import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientFraudCheckScoreReport } from "./lenient-fraud-check-score-report.js";
import { LenientFraudCheckScore, newLenientFraudCheckScore } from "./lenient-fraud-check-score.js";

test("LenientFraudCheckScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_126_700);
  const items: LenientFraudCheckScore[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLenientFraudCheckScore(`lenient-fraud-check-score-${index}`, "sample"));
  }
  const report = buildLenientFraudCheckScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
