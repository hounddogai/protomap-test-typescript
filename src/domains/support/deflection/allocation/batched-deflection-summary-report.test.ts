import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedDeflectionSummaryReport } from "./batched-deflection-summary-report.js";
import { BatchedDeflectionSummary, newBatchedDeflectionSummary } from "./batched-deflection-summary.js";

test("BatchedDeflectionSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_885_629);
  const items: BatchedDeflectionSummary[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedDeflectionSummary(`batched-deflection-summary-${index}`, "sample"));
  }
  const report = buildBatchedDeflectionSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
