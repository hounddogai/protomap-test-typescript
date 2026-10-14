import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionBundleView, toRetentionBundleViews } from "./retention-bundle-view.js";
import { newRetentionBundle } from "./retention-bundle.js";

test("RetentionBundleView shows the status in capitals", () => {
  const item = newRetentionBundle("code-138", "label-489");
  const view = toRetentionBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionBundleViews([item, item]).length, 2, "views");
});
