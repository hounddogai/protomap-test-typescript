import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingPacingScoreReport } from "./rolling-pacing-score-report.js";
import { RollingPacingScore, newRollingPacingScore } from "./rolling-pacing-score.js";

test("RollingPacingScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_701_764);
  const items: RollingPacingScore[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingPacingScore(`rolling-pacing-score-${index}`, "sample"));
  }
  const report = buildRollingPacingScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
