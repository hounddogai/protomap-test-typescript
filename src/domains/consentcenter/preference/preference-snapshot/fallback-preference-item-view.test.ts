import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackPreferenceItemView, toFallbackPreferenceItemViews } from "./fallback-preference-item-view.js";
import { newFallbackPreferenceItem } from "./fallback-preference-item.js";

test("FallbackPreferenceItemView shows the status in capitals", () => {
  const item = newFallbackPreferenceItem("code-189", "title-730");
  const view = toFallbackPreferenceItemView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackPreferenceItemViews([item, item]).length, 2, "views");
});
