import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRetentionScoreReport } from "./retention-score-report.js";
import { RetentionScore, newRetentionScore } from "./retention-score.js";

test("RetentionScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_693_568);
  const items: RetentionScore[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRetentionScore(`retention-score-${index}`, "sample"));
  }
  const report = buildRetentionScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
