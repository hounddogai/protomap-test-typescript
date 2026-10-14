import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedInviteNoticeView, toBatchedInviteNoticeViews } from "./batched-invite-notice-view.js";
import { newBatchedInviteNotice } from "./batched-invite-notice.js";

test("BatchedInviteNoticeView shows the status in capitals", () => {
  const item = newBatchedInviteNotice("code-748", "name-649");
  const view = toBatchedInviteNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedInviteNoticeViews([item, item]).length, 2, "views");
});
