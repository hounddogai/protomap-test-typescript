import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredWindowPreferenceView, toTieredWindowPreferenceViews } from "./tiered-window-preference-view.js";
import { newTieredWindowPreference } from "./tiered-window-preference.js";

test("TieredWindowPreferenceView shows the status in capitals", () => {
  const item = newTieredWindowPreference("code-55", "label-758");
  const view = toTieredWindowPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredWindowPreferenceViews([item, item]).length, 2, "views");
});
