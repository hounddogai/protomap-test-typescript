import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleQuotaView, toBidRuleQuotaViews } from "./bid-rule-quota-view.js";
import { newBidRuleQuota } from "./bid-rule-quota.js";

test("BidRuleQuotaView shows the status in capitals", () => {
  const item = newBidRuleQuota("code-892", "title-492");
  const view = toBidRuleQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleQuotaViews([item, item]).length, 2, "views");
});
