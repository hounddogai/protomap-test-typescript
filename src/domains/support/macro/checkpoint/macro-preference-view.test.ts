import assert from "node:assert/strict";
import { test } from "node:test";
import { toMacroPreferenceView, toMacroPreferenceViews } from "./macro-preference-view.js";
import { newMacroPreference } from "./macro-preference.js";

test("MacroPreferenceView shows the status in capitals", () => {
  const item = newMacroPreference("code-215", "label-177");
  const view = toMacroPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMacroPreferenceViews([item, item]).length, 2, "views");
});
