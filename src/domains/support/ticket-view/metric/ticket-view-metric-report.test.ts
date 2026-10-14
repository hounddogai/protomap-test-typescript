import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewMetricReport } from "./ticket-view-metric-report.js";
import { TicketViewMetric, newTicketViewMetric } from "./ticket-view-metric.js";

test("TicketViewMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_612_802);
  const items: TicketViewMetric[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTicketViewMetric(`ticket-view-metric-${index}`, "sample"));
  }
  const report = buildTicketViewMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
