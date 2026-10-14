import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackCreativePreferenceView,
  toFallbackCreativePreferenceViews,
} from "./fallback-creative-preference-view.js";
import { newFallbackCreativePreference } from "./fallback-creative-preference.js";

test("FallbackCreativePreferenceView shows the status in capitals", () => {
  const item = newFallbackCreativePreference("code-815", "title-381");
  const view = toFallbackCreativePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackCreativePreferenceViews([item, item]).length, 2, "views");
});
