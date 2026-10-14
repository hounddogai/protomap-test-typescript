import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingWaitBaselineView, toRollingWaitBaselineViews } from "./rolling-wait-baseline-view.js";
import { newRollingWaitBaseline } from "./rolling-wait-baseline.js";

test("RollingWaitBaselineView shows the status in capitals", () => {
  const item = newRollingWaitBaseline("code-24", "name-369");
  const view = toRollingWaitBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingWaitBaselineViews([item, item]).length, 2, "views");
});
