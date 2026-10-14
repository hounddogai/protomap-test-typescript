import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedConversionCycleView, toBatchedConversionCycleViews } from "./batched-conversion-cycle-view.js";
import { newBatchedConversionCycle } from "./batched-conversion-cycle.js";

test("BatchedConversionCycleView shows the status in capitals", () => {
  const item = newBatchedConversionCycle("code-845", "label-911");
  const view = toBatchedConversionCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedConversionCycleViews([item, item]).length, 2, "views");
});
