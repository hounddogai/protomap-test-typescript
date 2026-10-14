import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledTouchpointPreferenceView,
  toScheduledTouchpointPreferenceViews,
} from "./scheduled-touchpoint-preference-view.js";
import { newScheduledTouchpointPreference } from "./scheduled-touchpoint-preference.js";

test("ScheduledTouchpointPreferenceView shows the status in capitals", () => {
  const item = newScheduledTouchpointPreference("code-118", "name-432");
  const view = toScheduledTouchpointPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledTouchpointPreferenceViews([item, item]).length, 2, "views");
});
