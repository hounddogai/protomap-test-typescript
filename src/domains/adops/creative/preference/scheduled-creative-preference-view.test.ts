import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledCreativePreferenceView,
  toScheduledCreativePreferenceViews,
} from "./scheduled-creative-preference-view.js";
import { newScheduledCreativePreference } from "./scheduled-creative-preference.js";

test("ScheduledCreativePreferenceView shows the status in capitals", () => {
  const item = newScheduledCreativePreference("code-900", "label-582");
  const view = toScheduledCreativePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledCreativePreferenceViews([item, item]).length, 2, "views");
});
