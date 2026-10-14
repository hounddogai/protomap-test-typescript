import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultRedemptionEstimateReport } from "./default-redemption-estimate-report.js";
import { DefaultRedemptionEstimate, newDefaultRedemptionEstimate } from "./default-redemption-estimate.js";

test("DefaultRedemptionEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_928_917);
  const items: DefaultRedemptionEstimate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDefaultRedemptionEstimate(`default-redemption-estimate-${index}`, "sample"));
  }
  const report = buildDefaultRedemptionEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
