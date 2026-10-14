import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredLevelPreferenceView, toTieredLevelPreferenceViews } from "./tiered-level-preference-view.js";
import { newTieredLevelPreference } from "./tiered-level-preference.js";

test("TieredLevelPreferenceView shows the status in capitals", () => {
  const item = newTieredLevelPreference("code-172", "label-39");
  const view = toTieredLevelPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredLevelPreferenceViews([item, item]).length, 2, "views");
});
