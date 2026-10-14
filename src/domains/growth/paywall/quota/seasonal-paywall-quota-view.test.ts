import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalPaywallQuotaView, toSeasonalPaywallQuotaViews } from "./seasonal-paywall-quota-view.js";
import { newSeasonalPaywallQuota } from "./seasonal-paywall-quota.js";

test("SeasonalPaywallQuotaView shows the status in capitals", () => {
  const item = newSeasonalPaywallQuota("code-607", "label-409");
  const view = toSeasonalPaywallQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalPaywallQuotaViews([item, item]).length, 2, "views");
});
