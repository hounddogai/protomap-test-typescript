import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveRedemptionSummaryReport } from "./adaptive-redemption-summary-report.js";
import { AdaptiveRedemptionSummary, newAdaptiveRedemptionSummary } from "./adaptive-redemption-summary.js";

test("AdaptiveRedemptionSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_474_557);
  const items: AdaptiveRedemptionSummary[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newAdaptiveRedemptionSummary(`adaptive-redemption-summary-${index}`, "sample"));
  }
  const report = buildAdaptiveRedemptionSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
