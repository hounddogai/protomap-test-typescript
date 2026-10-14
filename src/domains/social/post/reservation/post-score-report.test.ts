import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostScoreReport } from "./post-score-report.js";
import { PostScore, newPostScore } from "./post-score.js";

test("PostScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_126_439);
  const items: PostScore[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPostScore(`post-score-${index}`, "sample"));
  }
  const report = buildPostScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
