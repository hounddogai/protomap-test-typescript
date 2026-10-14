import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionPreferenceView, toDeflectionPreferenceViews } from "./deflection-preference-view.js";
import { newDeflectionPreference } from "./deflection-preference.js";

test("DeflectionPreferenceView shows the status in capitals", () => {
  const item = newDeflectionPreference("code-811", "name-749");
  const view = toDeflectionPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionPreferenceViews([item, item]).length, 2, "views");
});
