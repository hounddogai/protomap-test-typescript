import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedMacroScoreReport } from "./batched-macro-score-report.js";
import { BatchedMacroScore, newBatchedMacroScore } from "./batched-macro-score.js";

test("BatchedMacroScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_573_690);
  const items: BatchedMacroScore[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedMacroScore(`batched-macro-score-${index}`, "sample"));
  }
  const report = buildBatchedMacroScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
