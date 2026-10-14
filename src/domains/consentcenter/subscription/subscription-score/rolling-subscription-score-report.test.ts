import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingSubscriptionScoreReport } from "./rolling-subscription-score-report.js";
import { RollingSubscriptionScore, newRollingSubscriptionScore } from "./rolling-subscription-score.js";

test("RollingSubscriptionScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_489_715);
  const items: RollingSubscriptionScore[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingSubscriptionScore(`rolling-subscription-score-${index}`, "sample"));
  }
  const report = buildRollingSubscriptionScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
