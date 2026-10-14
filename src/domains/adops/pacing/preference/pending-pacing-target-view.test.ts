import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingPacingTargetView, toPendingPacingTargetViews } from "./pending-pacing-target-view.js";
import { newPendingPacingTarget } from "./pending-pacing-target.js";

test("PendingPacingTargetView shows the status in capitals", () => {
  const item = newPendingPacingTarget("code-322", "name-792");
  const view = toPendingPacingTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingPacingTargetViews([item, item]).length, 2, "views");
});
