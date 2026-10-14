import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingConversionPreferenceView,
  toRollingConversionPreferenceViews,
} from "./rolling-conversion-preference-view.js";
import { newRollingConversionPreference } from "./rolling-conversion-preference.js";

test("RollingConversionPreferenceView shows the status in capitals", () => {
  const item = newRollingConversionPreference("code-432", "label-452");
  const view = toRollingConversionPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingConversionPreferenceViews([item, item]).length, 2, "views");
});
