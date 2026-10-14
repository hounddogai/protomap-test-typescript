import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowBundleView, toWindowBundleViews } from "./window-bundle-view.js";
import { newWindowBundle } from "./window-bundle.js";

test("WindowBundleView shows the status in capitals", () => {
  const item = newWindowBundle("code-805", "name-702");
  const view = toWindowBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowBundleViews([item, item]).length, 2, "views");
});
