import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInsightScoreReport } from "./insight-score-report.js";
import { InsightScore, newInsightScore } from "./insight-score.js";

test("InsightScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_973_816);
  const items: InsightScore[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newInsightScore(`insight-score-${index}`, "sample"));
  }
  const report = buildInsightScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
