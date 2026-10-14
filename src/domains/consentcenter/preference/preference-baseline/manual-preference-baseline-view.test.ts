import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualPreferenceBaselineView,
  toManualPreferenceBaselineViews,
} from "./manual-preference-baseline-view.js";
import { newManualPreferenceBaseline } from "./manual-preference-baseline.js";

test("ManualPreferenceBaselineView shows the status in capitals", () => {
  const item = newManualPreferenceBaseline("code-445", "title-138");
  const view = toManualPreferenceBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualPreferenceBaselineViews([item, item]).length, 2, "views");
});
