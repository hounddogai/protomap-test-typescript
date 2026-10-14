import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalCreativeQuotaView, toSeasonalCreativeQuotaViews } from "./seasonal-creative-quota-view.js";
import { newSeasonalCreativeQuota } from "./seasonal-creative-quota.js";

test("SeasonalCreativeQuotaView shows the status in capitals", () => {
  const item = newSeasonalCreativeQuota("code-954", "label-339");
  const view = toSeasonalCreativeQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalCreativeQuotaViews([item, item]).length, 2, "views");
});
