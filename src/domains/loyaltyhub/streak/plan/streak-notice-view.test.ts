import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakNoticeView, toStreakNoticeViews } from "./streak-notice-view.js";
import { newStreakNotice } from "./streak-notice.js";

test("StreakNoticeView shows the status in capitals", () => {
  const item = newStreakNotice("code-421", "title-197");
  const view = toStreakNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakNoticeViews([item, item]).length, 2, "views");
});
