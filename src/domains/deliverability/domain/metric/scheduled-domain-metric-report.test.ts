import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledDomainMetricReport } from "./scheduled-domain-metric-report.js";
import { ScheduledDomainMetric, newScheduledDomainMetric } from "./scheduled-domain-metric.js";

test("ScheduledDomainMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_932_111);
  const items: ScheduledDomainMetric[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newScheduledDomainMetric(`scheduled-domain-metric-${index}`, "sample"));
  }
  const report = buildScheduledDomainMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
