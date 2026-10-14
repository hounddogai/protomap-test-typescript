import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedPostQuotaView, toBatchedPostQuotaViews } from "./batched-post-quota-view.js";
import { newBatchedPostQuota } from "./batched-post-quota.js";

test("BatchedPostQuotaView shows the status in capitals", () => {
  const item = newBatchedPostQuota("code-13", "name-169");
  const view = toBatchedPostQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedPostQuotaViews([item, item]).length, 2, "views");
});
