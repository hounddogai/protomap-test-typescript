import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredReplyPreferenceView, toTieredReplyPreferenceViews } from "./tiered-reply-preference-view.js";
import { newTieredReplyPreference } from "./tiered-reply-preference.js";

test("TieredReplyPreferenceView shows the status in capitals", () => {
  const item = newTieredReplyPreference("code-910", "name-453");
  const view = toTieredReplyPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredReplyPreferenceViews([item, item]).length, 2, "views");
});
