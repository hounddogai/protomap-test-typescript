import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredDoubleOptInQuotaView, toTieredDoubleOptInQuotaViews } from "./tiered-double-opt-in-quota-view.js";
import { newTieredDoubleOptInQuota } from "./tiered-double-opt-in-quota.js";

test("TieredDoubleOptInQuotaView shows the status in capitals", () => {
  const item = newTieredDoubleOptInQuota("code-199", "name-515");
  const view = toTieredDoubleOptInQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredDoubleOptInQuotaViews([item, item]).length, 2, "views");
});
