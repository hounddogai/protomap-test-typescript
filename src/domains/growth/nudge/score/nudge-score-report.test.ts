import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeScoreReport } from "./nudge-score-report.js";
import { NudgeScore, newNudgeScore } from "./nudge-score.js";

test("NudgeScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_878_721);
  const items: NudgeScore[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newNudgeScore(`nudge-score-${index}`, "sample"));
  }
  const report = buildNudgeScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
