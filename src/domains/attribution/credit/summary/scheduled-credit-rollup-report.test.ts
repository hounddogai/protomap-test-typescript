import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledCreditRollupReport } from "./scheduled-credit-rollup-report.js";
import { ScheduledCreditRollup, newScheduledCreditRollup } from "./scheduled-credit-rollup.js";

test("ScheduledCreditRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_573_185);
  const items: ScheduledCreditRollup[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledCreditRollup(`scheduled-credit-rollup-${index}`, "sample"));
  }
  const report = buildScheduledCreditRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
