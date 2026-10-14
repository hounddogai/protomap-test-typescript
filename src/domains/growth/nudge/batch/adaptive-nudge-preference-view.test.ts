import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveNudgePreferenceView, toAdaptiveNudgePreferenceViews } from "./adaptive-nudge-preference-view.js";
import { newAdaptiveNudgePreference } from "./adaptive-nudge-preference.js";

test("AdaptiveNudgePreferenceView shows the status in capitals", () => {
  const item = newAdaptiveNudgePreference("code-717", "label-438");
  const view = toAdaptiveNudgePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveNudgePreferenceViews([item, item]).length, 2, "views");
});
