import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingPostScoreReport } from "./rolling-post-score-report.js";
import { RollingPostScore, newRollingPostScore } from "./rolling-post-score.js";

test("RollingPostScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_931_904);
  const items: RollingPostScore[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingPostScore(`rolling-post-score-${index}`, "sample"));
  }
  const report = buildRollingPostScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
