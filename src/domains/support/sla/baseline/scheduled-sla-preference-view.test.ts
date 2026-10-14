import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledSlaPreferenceView, toScheduledSlaPreferenceViews } from "./scheduled-sla-preference-view.js";
import { newScheduledSlaPreference } from "./scheduled-sla-preference.js";

test("ScheduledSlaPreferenceView shows the status in capitals", () => {
  const item = newScheduledSlaPreference("code-181", "name-915");
  const view = toScheduledSlaPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledSlaPreferenceViews([item, item]).length, 2, "views");
});
