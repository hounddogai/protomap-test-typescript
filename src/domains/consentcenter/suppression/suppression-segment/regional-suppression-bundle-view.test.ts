import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalSuppressionBundleView,
  toRegionalSuppressionBundleViews,
} from "./regional-suppression-bundle-view.js";
import { newRegionalSuppressionBundle } from "./regional-suppression-bundle.js";

test("RegionalSuppressionBundleView shows the status in capitals", () => {
  const item = newRegionalSuppressionBundle("code-820", "title-789");
  const view = toRegionalSuppressionBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalSuppressionBundleViews([item, item]).length, 2, "views");
});
