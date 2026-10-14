import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackLevelPreferenceView, toFallbackLevelPreferenceViews } from "./fallback-level-preference-view.js";
import { newFallbackLevelPreference } from "./fallback-level-preference.js";

test("FallbackLevelPreferenceView shows the status in capitals", () => {
  const item = newFallbackLevelPreference("code-633", "label-74");
  const view = toFallbackLevelPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackLevelPreferenceViews([item, item]).length, 2, "views");
});
