import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionPreferenceView, toRetentionPreferenceViews } from "./retention-preference-view.js";
import { newRetentionPreference } from "./retention-preference.js";

test("RetentionPreferenceView shows the status in capitals", () => {
  const item = newRetentionPreference("code-985", "name-248");
  const view = toRetentionPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionPreferenceViews([item, item]).length, 2, "views");
});
