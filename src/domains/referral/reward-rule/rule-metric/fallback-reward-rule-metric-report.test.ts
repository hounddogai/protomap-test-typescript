import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackRewardRuleMetricReport } from "./fallback-reward-rule-metric-report.js";
import { FallbackRewardRuleMetric, newFallbackRewardRuleMetric } from "./fallback-reward-rule-metric.js";

test("FallbackRewardRuleMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_051_656);
  const items: FallbackRewardRuleMetric[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackRewardRuleMetric(`fallback-reward-rule-metric-${index}`, "sample"));
  }
  const report = buildFallbackRewardRuleMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
