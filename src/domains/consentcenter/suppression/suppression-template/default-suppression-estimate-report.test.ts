import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultSuppressionEstimateReport } from "./default-suppression-estimate-report.js";
import { DefaultSuppressionEstimate, newDefaultSuppressionEstimate } from "./default-suppression-estimate.js";

test("DefaultSuppressionEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_789_286);
  const items: DefaultSuppressionEstimate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDefaultSuppressionEstimate(`default-suppression-estimate-${index}`, "sample"));
  }
  const report = buildDefaultSuppressionEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
