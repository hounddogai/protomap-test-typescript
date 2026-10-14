import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackRetentionBundleView, toFallbackRetentionBundleViews } from "./fallback-retention-bundle-view.js";
import { newFallbackRetentionBundle } from "./fallback-retention-bundle.js";

test("FallbackRetentionBundleView shows the status in capitals", () => {
  const item = newFallbackRetentionBundle("code-916", "name-107");
  const view = toFallbackRetentionBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackRetentionBundleViews([item, item]).length, 2, "views");
});
