import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalExitRuleMetricReport } from "./seasonal-exit-rule-metric-report.js";
import { SeasonalExitRuleMetric, newSeasonalExitRuleMetric } from "./seasonal-exit-rule-metric.js";

test("SeasonalExitRuleMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_115_698);
  const items: SeasonalExitRuleMetric[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSeasonalExitRuleMetric(`seasonal-exit-rule-metric-${index}`, "sample"));
  }
  const report = buildSeasonalExitRuleMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
