import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionEstimateReport } from "./suppression-estimate-report.js";
import { SuppressionEstimate, newSuppressionEstimate } from "./suppression-estimate.js";

test("SuppressionEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_197_831);
  const items: SuppressionEstimate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSuppressionEstimate(`suppression-estimate-${index}`, "sample"));
  }
  const report = buildSuppressionEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
