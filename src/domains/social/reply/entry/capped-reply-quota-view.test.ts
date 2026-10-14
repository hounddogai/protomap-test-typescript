import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedReplyQuotaView, toCappedReplyQuotaViews } from "./capped-reply-quota-view.js";
import { newCappedReplyQuota } from "./capped-reply-quota.js";

test("CappedReplyQuotaView shows the status in capitals", () => {
  const item = newCappedReplyQuota("code-960", "label-874");
  const view = toCappedReplyQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedReplyQuotaViews([item, item]).length, 2, "views");
});
