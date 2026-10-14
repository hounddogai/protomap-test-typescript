import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionScoreReport } from "./suppression-score-report.js";
import { SuppressionScore, newSuppressionScore } from "./suppression-score.js";

test("SuppressionScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_756_427);
  const items: SuppressionScore[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSuppressionScore(`suppression-score-${index}`, "sample"));
  }
  const report = buildSuppressionScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
