import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredConversionQuotaView, toTieredConversionQuotaViews } from "./tiered-conversion-quota-view.js";
import { newTieredConversionQuota } from "./tiered-conversion-quota.js";

test("TieredConversionQuotaView shows the status in capitals", () => {
  const item = newTieredConversionQuota("code-169", "label-91");
  const view = toTieredConversionQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredConversionQuotaViews([item, item]).length, 2, "views");
});
