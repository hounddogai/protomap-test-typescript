import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalPaywallLedgerView, toSeasonalPaywallLedgerViews } from "./seasonal-paywall-ledger-view.js";
import { newSeasonalPaywallLedger } from "./seasonal-paywall-ledger.js";

test("SeasonalPaywallLedgerView shows the status in capitals", () => {
  const item = newSeasonalPaywallLedger("code-427", "title-111");
  const view = toSeasonalPaywallLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalPaywallLedgerViews([item, item]).length, 2, "views");
});
