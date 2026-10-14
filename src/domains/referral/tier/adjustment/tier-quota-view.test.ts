import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierQuotaView, toTierQuotaViews } from "./tier-quota-view.js";
import { newTierQuota } from "./tier-quota.js";

test("TierQuotaView shows the status in capitals", () => {
  const item = newTierQuota("code-511", "name-711");
  const view = toTierQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierQuotaViews([item, item]).length, 2, "views");
});
