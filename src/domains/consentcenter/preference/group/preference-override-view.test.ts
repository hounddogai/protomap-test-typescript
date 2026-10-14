import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceOverrideView, toPreferenceOverrideViews } from "./preference-override-view.js";
import { newPreferenceOverride } from "./preference-override.js";

test("PreferenceOverrideView shows the status in capitals", () => {
  const item = newPreferenceOverride("code-751", "label-821");
  const view = toPreferenceOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceOverrideViews([item, item]).length, 2, "views");
});
