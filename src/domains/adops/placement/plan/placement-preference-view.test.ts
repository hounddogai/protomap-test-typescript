import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementPreferenceView, toPlacementPreferenceViews } from "./placement-preference-view.js";
import { newPlacementPreference } from "./placement-preference.js";

test("PlacementPreferenceView shows the status in capitals", () => {
  const item = newPlacementPreference("code-853", "name-380");
  const view = toPlacementPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementPreferenceViews([item, item]).length, 2, "views");
});
