import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyCsatQuotaView, toLegacyCsatQuotaViews } from "./legacy-csat-quota-view.js";
import { newLegacyCsatQuota } from "./legacy-csat-quota.js";

test("LegacyCsatQuotaView shows the status in capitals", () => {
  const item = newLegacyCsatQuota("code-835", "label-509");
  const view = toLegacyCsatQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyCsatQuotaViews([item, item]).length, 2, "views");
});
