import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedFlightBudgetReport } from "./batched-flight-budget-report.js";
import { BatchedFlightBudget, newBatchedFlightBudget } from "./batched-flight-budget.js";

test("BatchedFlightBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_077_586);
  const items: BatchedFlightBudget[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedFlightBudget(`batched-flight-budget-${index}`, "sample"));
  }
  const report = buildBatchedFlightBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
