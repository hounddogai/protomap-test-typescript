import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledNudgePreferenceView,
  toScheduledNudgePreferenceViews,
} from "./scheduled-nudge-preference-view.js";
import { newScheduledNudgePreference } from "./scheduled-nudge-preference.js";

test("ScheduledNudgePreferenceView shows the status in capitals", () => {
  const item = newScheduledNudgePreference("code-687", "label-339");
  const view = toScheduledNudgePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledNudgePreferenceViews([item, item]).length, 2, "views");
});
