import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedBranchNoticeView, toBatchedBranchNoticeViews } from "./batched-branch-notice-view.js";
import { newBatchedBranchNotice } from "./batched-branch-notice.js";

test("BatchedBranchNoticeView shows the status in capitals", () => {
  const item = newBatchedBranchNotice("code-708", "title-457");
  const view = toBatchedBranchNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedBranchNoticeViews([item, item]).length, 2, "views");
});
