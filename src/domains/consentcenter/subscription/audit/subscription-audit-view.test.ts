import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionAuditView, toSubscriptionAuditViews } from "./subscription-audit-view.js";
import { newSubscriptionAudit } from "./subscription-audit.js";

test("SubscriptionAuditView shows the status in capitals", () => {
  const item = newSubscriptionAudit("code-108", "label-701");
  const view = toSubscriptionAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionAuditViews([item, item]).length, 2, "views");
});
