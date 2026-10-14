import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictPayoutQuotaView, toStrictPayoutQuotaViews } from "./strict-payout-quota-view.js";
import { newStrictPayoutQuota } from "./strict-payout-quota.js";

test("StrictPayoutQuotaView shows the status in capitals", () => {
  const item = newStrictPayoutQuota("code-338", "title-349");
  const view = toStrictPayoutQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictPayoutQuotaViews([item, item]).length, 2, "views");
});
