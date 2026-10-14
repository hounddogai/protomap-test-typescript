import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackSubscriptionScoreReport } from "./fallback-subscription-score-report.js";
import { FallbackSubscriptionScore, newFallbackSubscriptionScore } from "./fallback-subscription-score.js";

test("FallbackSubscriptionScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_380_829);
  const items: FallbackSubscriptionScore[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackSubscriptionScore(`fallback-subscription-score-${index}`, "sample"));
  }
  const report = buildFallbackSubscriptionScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
