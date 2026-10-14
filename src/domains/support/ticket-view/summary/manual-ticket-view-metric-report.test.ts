import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualTicketViewMetricReport } from "./manual-ticket-view-metric-report.js";
import { ManualTicketViewMetric, newManualTicketViewMetric } from "./manual-ticket-view-metric.js";

test("ManualTicketViewMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_957_558);
  const items: ManualTicketViewMetric[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newManualTicketViewMetric(`manual-ticket-view-metric-${index}`, "sample"));
  }
  const report = buildManualTicketViewMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
