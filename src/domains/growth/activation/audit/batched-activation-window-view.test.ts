import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedActivationWindowView, toBatchedActivationWindowViews } from "./batched-activation-window-view.js";
import { newBatchedActivationWindow } from "./batched-activation-window.js";

test("BatchedActivationWindowView shows the status in capitals", () => {
  const item = newBatchedActivationWindow("code-597", "label-315");
  const view = toBatchedActivationWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedActivationWindowViews([item, item]).length, 2, "views");
});
