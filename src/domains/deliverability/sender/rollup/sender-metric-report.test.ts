import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderMetricReport } from "./sender-metric-report.js";
import { SenderMetric, newSenderMetric } from "./sender-metric.js";

test("SenderMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_508_918);
  const items: SenderMetric[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSenderMetric(`sender-metric-${index}`, "sample"));
  }
  const report = buildSenderMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
