import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyPayoutQuotaView, toLegacyPayoutQuotaViews } from "./legacy-payout-quota-view.js";
import { newLegacyPayoutQuota } from "./legacy-payout-quota.js";

test("LegacyPayoutQuotaView shows the status in capitals", () => {
  const item = newLegacyPayoutQuota("code-422", "title-504");
  const view = toLegacyPayoutQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyPayoutQuotaViews([item, item]).length, 2, "views");
});
