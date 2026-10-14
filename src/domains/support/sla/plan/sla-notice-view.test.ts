import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaNoticeView, toSlaNoticeViews } from "./sla-notice-view.js";
import { newSlaNotice } from "./sla-notice.js";

test("SlaNoticeView shows the status in capitals", () => {
  const item = newSlaNotice("code-560", "name-661");
  const view = toSlaNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaNoticeViews([item, item]).length, 2, "views");
});
