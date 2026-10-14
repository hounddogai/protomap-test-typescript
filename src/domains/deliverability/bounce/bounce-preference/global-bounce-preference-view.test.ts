import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalBouncePreferenceView, toGlobalBouncePreferenceViews } from "./global-bounce-preference-view.js";
import { newGlobalBouncePreference } from "./global-bounce-preference.js";

test("GlobalBouncePreferenceView shows the status in capitals", () => {
  const item = newGlobalBouncePreference("code-874", "label-329");
  const view = toGlobalBouncePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalBouncePreferenceViews([item, item]).length, 2, "views");
});
