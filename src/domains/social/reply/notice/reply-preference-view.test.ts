import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyPreferenceView, toReplyPreferenceViews } from "./reply-preference-view.js";
import { newReplyPreference } from "./reply-preference.js";

test("ReplyPreferenceView shows the status in capitals", () => {
  const item = newReplyPreference("code-850", "title-77");
  const view = toReplyPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyPreferenceViews([item, item]).length, 2, "views");
});
