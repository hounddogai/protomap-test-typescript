import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalEscalationMetricReport } from "./seasonal-escalation-metric-report.js";
import { SeasonalEscalationMetric, newSeasonalEscalationMetric } from "./seasonal-escalation-metric.js";

test("SeasonalEscalationMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_148_641);
  const items: SeasonalEscalationMetric[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSeasonalEscalationMetric(`seasonal-escalation-metric-${index}`, "sample"));
  }
  const report = buildSeasonalEscalationMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
