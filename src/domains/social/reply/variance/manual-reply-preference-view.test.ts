import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualReplyPreferenceView, toManualReplyPreferenceViews } from "./manual-reply-preference-view.js";
import { newManualReplyPreference } from "./manual-reply-preference.js";

test("ManualReplyPreferenceView shows the status in capitals", () => {
  const item = newManualReplyPreference("code-168", "name-449");
  const view = toManualReplyPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualReplyPreferenceViews([item, item]).length, 2, "views");
});
