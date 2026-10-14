import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientPreferenceBaselineView,
  toLenientPreferenceBaselineViews,
} from "./lenient-preference-baseline-view.js";
import { newLenientPreferenceBaseline } from "./lenient-preference-baseline.js";

test("LenientPreferenceBaselineView shows the status in capitals", () => {
  const item = newLenientPreferenceBaseline("code-721", "title-279");
  const view = toLenientPreferenceBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientPreferenceBaselineViews([item, item]).length, 2, "views");
});
