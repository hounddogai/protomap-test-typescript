import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionQuotaView, toSubscriptionQuotaViews } from "./subscription-quota-view.js";
import { newSubscriptionQuota } from "./subscription-quota.js";

test("SubscriptionQuotaView shows the status in capitals", () => {
  const item = newSubscriptionQuota("code-698", "label-52");
  const view = toSubscriptionQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionQuotaViews([item, item]).length, 2, "views");
});
