import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveFunnelEstimateReport } from "./adaptive-funnel-estimate-report.js";
import { AdaptiveFunnelEstimate, newAdaptiveFunnelEstimate } from "./adaptive-funnel-estimate.js";

test("AdaptiveFunnelEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_171_505);
  const items: AdaptiveFunnelEstimate[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newAdaptiveFunnelEstimate(`adaptive-funnel-estimate-${index}`, "sample"));
  }
  const report = buildAdaptiveFunnelEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
