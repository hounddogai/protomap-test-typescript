import assert from "node:assert/strict";
import { test } from "node:test";
import { toQueueNoticeView, toQueueNoticeViews } from "./queue-notice-view.js";
import { newQueueNotice } from "./queue-notice.js";

test("QueueNoticeView shows the status in capitals", () => {
  const item = newQueueNotice("code-49", "title-453");
  const view = toQueueNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toQueueNoticeViews([item, item]).length, 2, "views");
});
