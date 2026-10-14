import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultFraudCheckScoreReport } from "./default-fraud-check-score-report.js";
import { DefaultFraudCheckScore, newDefaultFraudCheckScore } from "./default-fraud-check-score.js";

test("DefaultFraudCheckScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_642_085);
  const items: DefaultFraudCheckScore[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDefaultFraudCheckScore(`default-fraud-check-score-${index}`, "sample"));
  }
  const report = buildDefaultFraudCheckScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
