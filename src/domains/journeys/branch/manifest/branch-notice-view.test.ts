import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchNoticeView, toBranchNoticeViews } from "./branch-notice-view.js";
import { newBranchNotice } from "./branch-notice.js";

test("BranchNoticeView shows the status in capitals", () => {
  const item = newBranchNotice("code-295", "name-665");
  const view = toBranchNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchNoticeViews([item, item]).length, 2, "views");
});
