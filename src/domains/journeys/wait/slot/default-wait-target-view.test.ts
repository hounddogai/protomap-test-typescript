import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultWaitTargetView, toDefaultWaitTargetViews } from "./default-wait-target-view.js";
import { newDefaultWaitTarget } from "./default-wait-target.js";

test("DefaultWaitTargetView shows the status in capitals", () => {
  const item = newDefaultWaitTarget("code-105", "label-574");
  const view = toDefaultWaitTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultWaitTargetViews([item, item]).length, 2, "views");
});
