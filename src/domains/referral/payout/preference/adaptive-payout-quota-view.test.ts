import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptivePayoutQuotaView, toAdaptivePayoutQuotaViews } from "./adaptive-payout-quota-view.js";
import { newAdaptivePayoutQuota } from "./adaptive-payout-quota.js";

test("AdaptivePayoutQuotaView shows the status in capitals", () => {
  const item = newAdaptivePayoutQuota("code-525", "label-341");
  const view = toAdaptivePayoutQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptivePayoutQuotaViews([item, item]).length, 2, "views");
});
