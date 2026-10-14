import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStepScoreReport } from "./step-score-report.js";
import { StepScore, newStepScore } from "./step-score.js";

test("StepScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_372_177);
  const items: StepScore[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStepScore(`step-score-${index}`, "sample"));
  }
  const report = buildStepScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
