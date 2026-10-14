import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedEscalationRollupView, toBatchedEscalationRollupViews } from "./batched-escalation-rollup-view.js";
import { newBatchedEscalationRollup } from "./batched-escalation-rollup.js";

test("BatchedEscalationRollupView shows the status in capitals", () => {
  const item = newBatchedEscalationRollup("code-65", "title-137");
  const view = toBatchedEscalationRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedEscalationRollupViews([item, item]).length, 2, "views");
});
