import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredSuppressionEstimateReport } from "./tiered-suppression-estimate-report.js";
import { TieredSuppressionEstimate, newTieredSuppressionEstimate } from "./tiered-suppression-estimate.js";

test("TieredSuppressionEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_480_360);
  const items: TieredSuppressionEstimate[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredSuppressionEstimate(`tiered-suppression-estimate-${index}`, "sample"));
  }
  const report = buildTieredSuppressionEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
