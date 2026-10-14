import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedPathCycleView, toBatchedPathCycleViews } from "./batched-path-cycle-view.js";
import { newBatchedPathCycle } from "./batched-path-cycle.js";

test("BatchedPathCycleView shows the status in capitals", () => {
  const item = newBatchedPathCycle("code-308", "label-204");
  const view = toBatchedPathCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedPathCycleViews([item, item]).length, 2, "views");
});
