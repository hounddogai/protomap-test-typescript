import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupNoticeView, toWarmupNoticeViews } from "./warmup-notice-view.js";
import { newWarmupNotice } from "./warmup-notice.js";

test("WarmupNoticeView shows the status in capitals", () => {
  const item = newWarmupNotice("code-97", "name-320");
  const view = toWarmupNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupNoticeViews([item, item]).length, 2, "views");
});
