import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRedemptionScoreReport } from "./redemption-score-report.js";
import { RedemptionScore, newRedemptionScore } from "./redemption-score.js";

test("RedemptionScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_658_551);
  const items: RedemptionScore[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRedemptionScore(`redemption-score-${index}`, "sample"));
  }
  const report = buildRedemptionScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
