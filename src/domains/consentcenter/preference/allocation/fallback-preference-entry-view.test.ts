import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackPreferenceEntryView, toFallbackPreferenceEntryViews } from "./fallback-preference-entry-view.js";
import { newFallbackPreferenceEntry } from "./fallback-preference-entry.js";

test("FallbackPreferenceEntryView shows the status in capitals", () => {
  const item = newFallbackPreferenceEntry("code-520", "title-438");
  const view = toFallbackPreferenceEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackPreferenceEntryViews([item, item]).length, 2, "views");
});
