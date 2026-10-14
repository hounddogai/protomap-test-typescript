import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackDoubleOptInBundleView,
  toFallbackDoubleOptInBundleViews,
} from "./fallback-double-opt-in-bundle-view.js";
import { newFallbackDoubleOptInBundle } from "./fallback-double-opt-in-bundle.js";

test("FallbackDoubleOptInBundleView shows the status in capitals", () => {
  const item = newFallbackDoubleOptInBundle("code-758", "name-29");
  const view = toFallbackDoubleOptInBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackDoubleOptInBundleViews([item, item]).length, 2, "views");
});
