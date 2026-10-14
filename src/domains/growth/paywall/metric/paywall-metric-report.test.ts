import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPaywallMetricReport } from "./paywall-metric-report.js";
import { PaywallMetric, newPaywallMetric } from "./paywall-metric.js";

test("PaywallMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_258_056);
  const items: PaywallMetric[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPaywallMetric(`paywall-metric-${index}`, "sample"));
  }
  const report = buildPaywallMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
