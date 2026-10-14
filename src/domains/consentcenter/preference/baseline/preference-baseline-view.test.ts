import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceBaselineView, toPreferenceBaselineViews } from "./preference-baseline-view.js";
import { newPreferenceBaseline } from "./preference-baseline.js";

test("PreferenceBaselineView shows the status in capitals", () => {
  const item = newPreferenceBaseline("code-863", "name-64");
  const view = toPreferenceBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceBaselineViews([item, item]).length, 2, "views");
});
