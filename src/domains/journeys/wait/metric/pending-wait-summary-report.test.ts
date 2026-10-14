import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingWaitSummaryReport } from "./pending-wait-summary-report.js";
import { PendingWaitSummary, newPendingWaitSummary } from "./pending-wait-summary.js";

test("PendingWaitSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_449_799);
  const items: PendingWaitSummary[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPendingWaitSummary(`pending-wait-summary-${index}`, "sample"));
  }
  const report = buildPendingWaitSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
