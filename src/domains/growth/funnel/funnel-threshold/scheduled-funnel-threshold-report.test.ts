import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledFunnelThresholdReport } from "./scheduled-funnel-threshold-report.js";
import { ScheduledFunnelThreshold, newScheduledFunnelThreshold } from "./scheduled-funnel-threshold.js";

test("ScheduledFunnelThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_105_063);
  const items: ScheduledFunnelThreshold[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newScheduledFunnelThreshold(`scheduled-funnel-threshold-${index}`, "sample"));
  }
  const report = buildScheduledFunnelThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
