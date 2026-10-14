import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelNoticeView, toFunnelNoticeViews } from "./funnel-notice-view.js";
import { newFunnelNotice } from "./funnel-notice.js";

test("FunnelNoticeView shows the status in capitals", () => {
  const item = newFunnelNotice("code-929", "name-853");
  const view = toFunnelNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelNoticeViews([item, item]).length, 2, "views");
});
