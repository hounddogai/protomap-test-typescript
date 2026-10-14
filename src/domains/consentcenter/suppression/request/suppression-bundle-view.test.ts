import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionBundleView, toSuppressionBundleViews } from "./suppression-bundle-view.js";
import { newSuppressionBundle } from "./suppression-bundle.js";

test("SuppressionBundleView shows the status in capitals", () => {
  const item = newSuppressionBundle("code-464", "name-638");
  const view = toSuppressionBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionBundleViews([item, item]).length, 2, "views");
});
