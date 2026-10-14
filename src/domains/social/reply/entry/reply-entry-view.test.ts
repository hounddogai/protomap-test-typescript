import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyEntryView, toReplyEntryViews } from "./reply-entry-view.js";
import { newReplyEntry } from "./reply-entry.js";

test("ReplyEntryView shows the status in capitals", () => {
  const item = newReplyEntry("code-512", "label-871");
  const view = toReplyEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyEntryViews([item, item]).length, 2, "views");
});
