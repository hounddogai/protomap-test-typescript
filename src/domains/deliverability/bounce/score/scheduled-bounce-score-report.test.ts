import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledBounceScoreReport } from "./scheduled-bounce-score-report.js";
import { ScheduledBounceScore, newScheduledBounceScore } from "./scheduled-bounce-score.js";

test("ScheduledBounceScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_489_787);
  const items: ScheduledBounceScore[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledBounceScore(`scheduled-bounce-score-${index}`, "sample"));
  }
  const report = buildScheduledBounceScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
