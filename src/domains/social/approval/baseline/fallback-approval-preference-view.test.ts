import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackApprovalPreferenceView,
  toFallbackApprovalPreferenceViews,
} from "./fallback-approval-preference-view.js";
import { newFallbackApprovalPreference } from "./fallback-approval-preference.js";

test("FallbackApprovalPreferenceView shows the status in capitals", () => {
  const item = newFallbackApprovalPreference("code-797", "label-982");
  const view = toFallbackApprovalPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackApprovalPreferenceViews([item, item]).length, 2, "views");
});
