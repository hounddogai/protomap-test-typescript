import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionNoticeView, toRetentionNoticeViews } from "./retention-notice-view.js";
import { newRetentionNotice } from "./retention-notice.js";

test("RetentionNoticeView shows the status in capitals", () => {
  const item = newRetentionNotice("code-302", "name-628");
  const view = toRetentionNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionNoticeViews([item, item]).length, 2, "views");
});
