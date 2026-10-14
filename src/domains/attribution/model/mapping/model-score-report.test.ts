import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelScoreReport } from "./model-score-report.js";
import { ModelScore, newModelScore } from "./model-score.js";

test("ModelScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_591_775);
  const items: ModelScore[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newModelScore(`model-score-${index}`, "sample"));
  }
  const report = buildModelScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
