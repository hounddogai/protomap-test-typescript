import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelThresholdReport } from "./funnel-threshold-report.js";
import { FunnelThreshold, newFunnelThreshold } from "./funnel-threshold.js";

test("FunnelThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_971_949);
  const items: FunnelThreshold[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFunnelThreshold(`funnel-threshold-${index}`, "sample"));
  }
  const report = buildFunnelThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
