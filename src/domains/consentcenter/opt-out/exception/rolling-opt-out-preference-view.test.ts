import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingOptOutPreferenceView, toRollingOptOutPreferenceViews } from "./rolling-opt-out-preference-view.js";
import { newRollingOptOutPreference } from "./rolling-opt-out-preference.js";

test("RollingOptOutPreferenceView shows the status in capitals", () => {
  const item = newRollingOptOutPreference("code-862", "title-728");
  const view = toRollingOptOutPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingOptOutPreferenceViews([item, item]).length, 2, "views");
});
