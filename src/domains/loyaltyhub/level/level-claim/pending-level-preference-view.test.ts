import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingLevelPreferenceView, toPendingLevelPreferenceViews } from "./pending-level-preference-view.js";
import { newPendingLevelPreference } from "./pending-level-preference.js";

test("PendingLevelPreferenceView shows the status in capitals", () => {
  const item = newPendingLevelPreference("code-850", "name-440");
  const view = toPendingLevelPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingLevelPreferenceViews([item, item]).length, 2, "views");
});
