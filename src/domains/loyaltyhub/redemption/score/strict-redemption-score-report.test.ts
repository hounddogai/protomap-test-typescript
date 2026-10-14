import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictRedemptionScoreReport } from "./strict-redemption-score-report.js";
import { StrictRedemptionScore, newStrictRedemptionScore } from "./strict-redemption-score.js";

test("StrictRedemptionScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_561_181);
  const items: StrictRedemptionScore[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictRedemptionScore(`strict-redemption-score-${index}`, "sample"));
  }
  const report = buildStrictRedemptionScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
