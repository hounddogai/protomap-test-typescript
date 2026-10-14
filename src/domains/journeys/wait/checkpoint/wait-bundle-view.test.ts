import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitBundleView, toWaitBundleViews } from "./wait-bundle-view.js";
import { newWaitBundle } from "./wait-bundle.js";

test("WaitBundleView shows the status in capitals", () => {
  const item = newWaitBundle("code-435", "name-427");
  const view = toWaitBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitBundleViews([item, item]).length, 2, "views");
});
