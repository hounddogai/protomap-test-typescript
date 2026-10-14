import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledPayoutScoreReport } from "./scheduled-payout-score-report.js";
import { ScheduledPayoutScore, newScheduledPayoutScore } from "./scheduled-payout-score.js";

test("ScheduledPayoutScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_888_820);
  const items: ScheduledPayoutScore[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newScheduledPayoutScore(`scheduled-payout-score-${index}`, "sample"));
  }
  const report = buildScheduledPayoutScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
