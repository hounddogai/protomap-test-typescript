import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingStreakBundleView, toPendingStreakBundleViews } from "./pending-streak-bundle-view.js";
import { newPendingStreakBundle } from "./pending-streak-bundle.js";

test("PendingStreakBundleView shows the status in capitals", () => {
  const item = newPendingStreakBundle("code-646", "label-896");
  const view = toPendingStreakBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingStreakBundleViews([item, item]).length, 2, "views");
});
