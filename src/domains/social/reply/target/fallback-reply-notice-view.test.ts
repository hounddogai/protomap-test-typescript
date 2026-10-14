import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackReplyNoticeView, toFallbackReplyNoticeViews } from "./fallback-reply-notice-view.js";
import { newFallbackReplyNotice } from "./fallback-reply-notice.js";

test("FallbackReplyNoticeView shows the status in capitals", () => {
  const item = newFallbackReplyNotice("code-924", "title-935");
  const view = toFallbackReplyNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackReplyNoticeViews([item, item]).length, 2, "views");
});
