import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderPreferenceView, toSenderPreferenceViews } from "./sender-preference-view.js";
import { newSenderPreference } from "./sender-preference.js";

test("SenderPreferenceView shows the status in capitals", () => {
  const item = newSenderPreference("code-291", "name-970");
  const view = toSenderPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderPreferenceViews([item, item]).length, 2, "views");
});
