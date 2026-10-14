import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathPreferenceView, toPathPreferenceViews } from "./path-preference-view.js";
import { newPathPreference } from "./path-preference.js";

test("PathPreferenceView shows the status in capitals", () => {
  const item = newPathPreference("code-983", "title-620");
  const view = toPathPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathPreferenceViews([item, item]).length, 2, "views");
});
