import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualTouchpointBundleView, toManualTouchpointBundleViews } from "./manual-touchpoint-bundle-view.js";
import { newManualTouchpointBundle } from "./manual-touchpoint-bundle.js";

test("ManualTouchpointBundleView shows the status in capitals", () => {
  const item = newManualTouchpointBundle("code-821", "label-510");
  const view = toManualTouchpointBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualTouchpointBundleViews([item, item]).length, 2, "views");
});
