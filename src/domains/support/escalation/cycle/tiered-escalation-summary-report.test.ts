import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredEscalationSummaryReport } from "./tiered-escalation-summary-report.js";
import { TieredEscalationSummary, newTieredEscalationSummary } from "./tiered-escalation-summary.js";

test("TieredEscalationSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_926_713);
  const items: TieredEscalationSummary[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredEscalationSummary(`tiered-escalation-summary-${index}`, "sample"));
  }
  const report = buildTieredEscalationSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
