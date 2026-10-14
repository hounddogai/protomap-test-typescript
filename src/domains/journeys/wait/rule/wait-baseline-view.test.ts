import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitBaselineView, toWaitBaselineViews } from "./wait-baseline-view.js";
import { newWaitBaseline } from "./wait-baseline.js";

test("WaitBaselineView shows the status in capitals", () => {
  const item = newWaitBaseline("code-269", "label-565");
  const view = toWaitBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitBaselineViews([item, item]).length, 2, "views");
});
