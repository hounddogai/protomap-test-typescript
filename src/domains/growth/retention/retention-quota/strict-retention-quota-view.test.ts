import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictRetentionQuotaView, toStrictRetentionQuotaViews } from "./strict-retention-quota-view.js";
import { newStrictRetentionQuota } from "./strict-retention-quota.js";

test("StrictRetentionQuotaView shows the status in capitals", () => {
  const item = newStrictRetentionQuota("code-248", "title-757");
  const view = toStrictRetentionQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictRetentionQuotaViews([item, item]).length, 2, "views");
});
