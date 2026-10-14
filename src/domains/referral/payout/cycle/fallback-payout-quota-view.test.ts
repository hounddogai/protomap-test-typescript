import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackPayoutQuotaView, toFallbackPayoutQuotaViews } from "./fallback-payout-quota-view.js";
import { newFallbackPayoutQuota } from "./fallback-payout-quota.js";

test("FallbackPayoutQuotaView shows the status in capitals", () => {
  const item = newFallbackPayoutQuota("code-88", "name-768");
  const view = toFallbackPayoutQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackPayoutQuotaViews([item, item]).length, 2, "views");
});
