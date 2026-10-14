import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPayoutScoreReport } from "./payout-score-report.js";
import { PayoutScore, newPayoutScore } from "./payout-score.js";

test("PayoutScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_796_510);
  const items: PayoutScore[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPayoutScore(`payout-score-${index}`, "sample"));
  }
  const report = buildPayoutScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
