import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedCreditThresholdReport } from "./capped-credit-threshold-report.js";
import { CappedCreditThreshold, newCappedCreditThreshold } from "./capped-credit-threshold.js";

test("CappedCreditThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_303_904);
  const items: CappedCreditThreshold[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCappedCreditThreshold(`capped-credit-threshold-${index}`, "sample"));
  }
  const report = buildCappedCreditThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
