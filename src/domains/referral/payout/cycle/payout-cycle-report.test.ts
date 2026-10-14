import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPayoutCycleReport } from "./payout-cycle-report.js";
import { PayoutCycle, newPayoutCycle } from "./payout-cycle.js";

test("PayoutCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_513_997);
  const items: PayoutCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPayoutCycle(`payout-cycle-${index}`, "sample"));
  }
  const report = buildPayoutCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
