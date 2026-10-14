import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingStepRollupView, toPendingStepRollupViews } from "./pending-step-rollup-view.js";
import { newPendingStepRollup } from "./pending-step-rollup.js";

test("PendingStepRollupView shows the status in capitals", () => {
  const item = newPendingStepRollup("code-223", "label-972");
  const view = toPendingStepRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingStepRollupViews([item, item]).length, 2, "views");
});
