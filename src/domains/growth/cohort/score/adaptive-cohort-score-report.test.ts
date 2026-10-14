import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveCohortScoreReport } from "./adaptive-cohort-score-report.js";
import { AdaptiveCohortScore, newAdaptiveCohortScore } from "./adaptive-cohort-score.js";

test("AdaptiveCohortScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_502_096);
  const items: AdaptiveCohortScore[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newAdaptiveCohortScore(`adaptive-cohort-score-${index}`, "sample"));
  }
  const report = buildAdaptiveCohortScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
