import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackFraudCheckScoreReport } from "./fallback-fraud-check-score-report.js";
import { FallbackFraudCheckScore, newFallbackFraudCheckScore } from "./fallback-fraud-check-score.js";

test("FallbackFraudCheckScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_227_615);
  const items: FallbackFraudCheckScore[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackFraudCheckScore(`fallback-fraud-check-score-${index}`, "sample"));
  }
  const report = buildFallbackFraudCheckScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
