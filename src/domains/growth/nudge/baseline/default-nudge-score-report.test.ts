import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultNudgeScoreReport } from "./default-nudge-score-report.js";
import { DefaultNudgeScore, newDefaultNudgeScore } from "./default-nudge-score.js";

test("DefaultNudgeScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_463_760);
  const items: DefaultNudgeScore[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultNudgeScore(`default-nudge-score-${index}`, "sample"));
  }
  const report = buildDefaultNudgeScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
