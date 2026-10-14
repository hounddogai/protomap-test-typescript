import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingRedemptionScoreReport } from "./rolling-redemption-score-report.js";
import { RollingRedemptionScore, newRollingRedemptionScore } from "./rolling-redemption-score.js";

test("RollingRedemptionScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_959_146);
  const items: RollingRedemptionScore[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRollingRedemptionScore(`rolling-redemption-score-${index}`, "sample"));
  }
  const report = buildRollingRedemptionScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
