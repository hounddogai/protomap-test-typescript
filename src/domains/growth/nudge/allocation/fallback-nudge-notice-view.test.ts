import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackNudgeNoticeView, toFallbackNudgeNoticeViews } from "./fallback-nudge-notice-view.js";
import { newFallbackNudgeNotice } from "./fallback-nudge-notice.js";

test("FallbackNudgeNoticeView shows the status in capitals", () => {
  const item = newFallbackNudgeNotice("code-846", "title-187");
  const view = toFallbackNudgeNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackNudgeNoticeViews([item, item]).length, 2, "views");
});
