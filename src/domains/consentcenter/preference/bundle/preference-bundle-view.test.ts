import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceBundleView, toPreferenceBundleViews } from "./preference-bundle-view.js";
import { newPreferenceBundle } from "./preference-bundle.js";

test("PreferenceBundleView shows the status in capitals", () => {
  const item = newPreferenceBundle("code-222", "label-309");
  const view = toPreferenceBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceBundleViews([item, item]).length, 2, "views");
});
