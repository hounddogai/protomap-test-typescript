import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackCreditPreferenceView,
  toFallbackCreditPreferenceViews,
} from "./fallback-credit-preference-view.js";
import { newFallbackCreditPreference } from "./fallback-credit-preference.js";

test("FallbackCreditPreferenceView shows the status in capitals", () => {
  const item = newFallbackCreditPreference("code-991", "name-574");
  const view = toFallbackCreditPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackCreditPreferenceViews([item, item]).length, 2, "views");
});
