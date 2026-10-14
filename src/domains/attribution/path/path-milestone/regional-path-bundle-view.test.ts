import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalPathBundleView, toRegionalPathBundleViews } from "./regional-path-bundle-view.js";
import { newRegionalPathBundle } from "./regional-path-bundle.js";

test("RegionalPathBundleView shows the status in capitals", () => {
  const item = newRegionalPathBundle("code-708", "label-195");
  const view = toRegionalPathBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalPathBundleViews([item, item]).length, 2, "views");
});
