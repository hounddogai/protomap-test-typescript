import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalSubscriptionMetricReport } from "./seasonal-subscription-metric-report.js";
import { SeasonalSubscriptionMetric, newSeasonalSubscriptionMetric } from "./seasonal-subscription-metric.js";

test("SeasonalSubscriptionMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_649_423);
  const items: SeasonalSubscriptionMetric[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSeasonalSubscriptionMetric(`seasonal-subscription-metric-${index}`, "sample"));
  }
  const report = buildSeasonalSubscriptionMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
