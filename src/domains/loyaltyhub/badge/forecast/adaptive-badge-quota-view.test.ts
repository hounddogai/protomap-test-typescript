import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveBadgeQuotaView, toAdaptiveBadgeQuotaViews } from "./adaptive-badge-quota-view.js";
import { newAdaptiveBadgeQuota } from "./adaptive-badge-quota.js";

test("AdaptiveBadgeQuotaView shows the status in capitals", () => {
  const item = newAdaptiveBadgeQuota("code-260", "label-662");
  const view = toAdaptiveBadgeQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveBadgeQuotaViews([item, item]).length, 2, "views");
});
