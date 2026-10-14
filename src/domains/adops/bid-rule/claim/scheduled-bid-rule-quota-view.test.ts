import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledBidRuleQuotaView, toScheduledBidRuleQuotaViews } from "./scheduled-bid-rule-quota-view.js";
import { newScheduledBidRuleQuota } from "./scheduled-bid-rule-quota.js";

test("ScheduledBidRuleQuotaView shows the status in capitals", () => {
  const item = newScheduledBidRuleQuota("code-542", "name-360");
  const view = toScheduledBidRuleQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledBidRuleQuotaViews([item, item]).length, 2, "views");
});
