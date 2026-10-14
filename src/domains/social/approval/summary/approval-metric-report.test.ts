import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildApprovalMetricReport } from "./approval-metric-report.js";
import { ApprovalMetric, newApprovalMetric } from "./approval-metric.js";

test("ApprovalMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_454_631);
  const items: ApprovalMetric[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newApprovalMetric(`approval-metric-${index}`, "sample"));
  }
  const report = buildApprovalMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
