import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedPlacementBudgetReport } from "./batched-placement-budget-report.js";
import { BatchedPlacementBudget, newBatchedPlacementBudget } from "./batched-placement-budget.js";

test("BatchedPlacementBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_672_633);
  const items: BatchedPlacementBudget[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBatchedPlacementBudget(`batched-placement-budget-${index}`, "sample"));
  }
  const report = buildBatchedPlacementBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
