import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostBundleView, toPostBundleViews } from "./post-bundle-view.js";
import { newPostBundle } from "./post-bundle.js";

test("PostBundleView shows the status in capitals", () => {
  const item = newPostBundle("code-520", "name-252");
  const view = toPostBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostBundleViews([item, item]).length, 2, "views");
});
