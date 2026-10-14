import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryRedemptionSummaryReport } from "./primary-redemption-summary-report.js";
import { PrimaryRedemptionSummary, newPrimaryRedemptionSummary } from "./primary-redemption-summary.js";

test("PrimaryRedemptionSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_697_606);
  const items: PrimaryRedemptionSummary[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimaryRedemptionSummary(`primary-redemption-summary-${index}`, "sample"));
  }
  const report = buildPrimaryRedemptionSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
