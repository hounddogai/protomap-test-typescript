import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalRetentionBundleView, toGlobalRetentionBundleViews } from "./global-retention-bundle-view.js";
import { newGlobalRetentionBundle } from "./global-retention-bundle.js";

test("GlobalRetentionBundleView shows the status in capitals", () => {
  const item = newGlobalRetentionBundle("code-807", "name-185");
  const view = toGlobalRetentionBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalRetentionBundleViews([item, item]).length, 2, "views");
});
