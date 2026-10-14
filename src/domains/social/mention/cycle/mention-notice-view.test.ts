import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionNoticeView, toMentionNoticeViews } from "./mention-notice-view.js";
import { newMentionNotice } from "./mention-notice.js";

test("MentionNoticeView shows the status in capitals", () => {
  const item = newMentionNotice("code-655", "label-801");
  const view = toMentionNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionNoticeViews([item, item]).length, 2, "views");
});
