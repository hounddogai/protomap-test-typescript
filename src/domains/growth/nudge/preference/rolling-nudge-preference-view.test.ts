import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingNudgePreferenceView, toRollingNudgePreferenceViews } from "./rolling-nudge-preference-view.js";
import { newRollingNudgePreference } from "./rolling-nudge-preference.js";

test("RollingNudgePreferenceView shows the status in capitals", () => {
  const item = newRollingNudgePreference("code-939", "label-52");
  const view = toRollingNudgePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingNudgePreferenceViews([item, item]).length, 2, "views");
});
