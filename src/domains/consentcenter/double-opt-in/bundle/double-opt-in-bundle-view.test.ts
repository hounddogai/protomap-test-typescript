import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInBundleView, toDoubleOptInBundleViews } from "./double-opt-in-bundle-view.js";
import { newDoubleOptInBundle } from "./double-opt-in-bundle.js";

test("DoubleOptInBundleView shows the status in capitals", () => {
  const item = newDoubleOptInBundle("code-220", "name-707");
  const view = toDoubleOptInBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInBundleViews([item, item]).length, 2, "views");
});
