import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientChallengeScoreReport } from "./lenient-challenge-score-report.js";
import { LenientChallengeScore, newLenientChallengeScore } from "./lenient-challenge-score.js";

test("LenientChallengeScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_393_088);
  const items: LenientChallengeScore[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientChallengeScore(`lenient-challenge-score-${index}`, "sample"));
  }
  const report = buildLenientChallengeScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
