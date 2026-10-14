import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackStreakBundleView, toFallbackStreakBundleViews } from "./fallback-streak-bundle-view.js";
import { newFallbackStreakBundle } from "./fallback-streak-bundle.js";

test("FallbackStreakBundleView shows the status in capitals", () => {
  const item = newFallbackStreakBundle("code-306", "title-762");
  const view = toFallbackStreakBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackStreakBundleViews([item, item]).length, 2, "views");
});
