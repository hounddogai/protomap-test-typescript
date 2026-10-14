import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryReplyMetricReport } from "./primary-reply-metric-report.js";
import { PrimaryReplyMetric, newPrimaryReplyMetric } from "./primary-reply-metric.js";

test("PrimaryReplyMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_016_799);
  const items: PrimaryReplyMetric[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimaryReplyMetric(`primary-reply-metric-${index}`, "sample"));
  }
  const report = buildPrimaryReplyMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
