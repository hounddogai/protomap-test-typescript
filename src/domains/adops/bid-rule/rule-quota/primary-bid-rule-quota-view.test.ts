import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryBidRuleQuotaView, toPrimaryBidRuleQuotaViews } from "./primary-bid-rule-quota-view.js";
import { newPrimaryBidRuleQuota } from "./primary-bid-rule-quota.js";

test("PrimaryBidRuleQuotaView shows the status in capitals", () => {
  const item = newPrimaryBidRuleQuota("code-290", "title-846");
  const view = toPrimaryBidRuleQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryBidRuleQuotaViews([item, item]).length, 2, "views");
});
