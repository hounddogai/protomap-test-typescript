import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditMetricReport } from "./credit-metric-report.js";
import { CreditMetric, newCreditMetric } from "./credit-metric.js";

test("CreditMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_239_904);
  const items: CreditMetric[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCreditMetric(`credit-metric-${index}`, "sample"));
  }
  const report = buildCreditMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
