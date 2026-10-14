import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientRedemptionQuotaView, toLenientRedemptionQuotaViews } from "./lenient-redemption-quota-view.js";
import { newLenientRedemptionQuota } from "./lenient-redemption-quota.js";

test("LenientRedemptionQuotaView shows the status in capitals", () => {
  const item = newLenientRedemptionQuota("code-160", "name-316");
  const view = toLenientRedemptionQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientRedemptionQuotaViews([item, item]).length, 2, "views");
});
