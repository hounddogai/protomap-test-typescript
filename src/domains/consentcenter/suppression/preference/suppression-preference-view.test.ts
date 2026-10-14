import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionPreferenceView, toSuppressionPreferenceViews } from "./suppression-preference-view.js";
import { newSuppressionPreference } from "./suppression-preference.js";

test("SuppressionPreferenceView shows the status in capitals", () => {
  const item = newSuppressionPreference("code-682", "title-138");
  const view = toSuppressionPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionPreferenceViews([item, item]).length, 2, "views");
});
