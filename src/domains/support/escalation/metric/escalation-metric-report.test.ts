import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationMetricReport } from "./escalation-metric-report.js";
import { EscalationMetric, newEscalationMetric } from "./escalation-metric.js";

test("EscalationMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_705_651);
  const items: EscalationMetric[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newEscalationMetric(`escalation-metric-${index}`, "sample"));
  }
  const report = buildEscalationMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
