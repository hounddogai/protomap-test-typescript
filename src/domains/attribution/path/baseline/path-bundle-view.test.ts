import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathBundleView, toPathBundleViews } from "./path-bundle-view.js";
import { newPathBundle } from "./path-bundle.js";

test("PathBundleView shows the status in capitals", () => {
  const item = newPathBundle("code-848", "title-433");
  const view = toPathBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathBundleViews([item, item]).length, 2, "views");
});
