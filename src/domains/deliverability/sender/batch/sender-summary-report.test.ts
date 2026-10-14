import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderSummaryReport } from "./sender-summary-report.js";
import { SenderSummary, newSenderSummary } from "./sender-summary.js";

test("SenderSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_769_511);
  const items: SenderSummary[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSenderSummary(`sender-summary-${index}`, "sample"));
  }
  const report = buildSenderSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
