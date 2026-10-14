import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildQueueMetricReport } from "./queue-metric-report.js";
import { QueueMetric, newQueueMetric } from "./queue-metric.js";

test("QueueMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_972_842);
  const items: QueueMetric[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newQueueMetric(`queue-metric-${index}`, "sample"));
  }
  const report = buildQueueMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
