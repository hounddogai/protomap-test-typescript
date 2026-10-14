import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativePreferenceView, toCreativePreferenceViews } from "./creative-preference-view.js";
import { newCreativePreference } from "./creative-preference.js";

test("CreativePreferenceView shows the status in capitals", () => {
  const item = newCreativePreference("code-753", "label-813");
  const view = toCreativePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativePreferenceViews([item, item]).length, 2, "views");
});
