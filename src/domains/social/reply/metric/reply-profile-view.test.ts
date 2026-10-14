import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyProfileView, toReplyProfileViews } from "./reply-profile-view.js";
import { newReplyProfile } from "./reply-profile.js";

test("ReplyProfileView shows the status in capitals", () => {
  const item = newReplyProfile("code-32", "name-141");
  const view = toReplyProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyProfileViews([item, item]).length, 2, "views");
});
