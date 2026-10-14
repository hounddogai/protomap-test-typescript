import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackReplyScoreReport } from "./fallback-reply-score-report.js";
import { FallbackReplyScore, newFallbackReplyScore } from "./fallback-reply-score.js";

test("FallbackReplyScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_191_469);
  const items: FallbackReplyScore[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFallbackReplyScore(`fallback-reply-score-${index}`, "sample"));
  }
  const report = buildFallbackReplyScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
