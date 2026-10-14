import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredPaywallLedgerView, toTieredPaywallLedgerViews } from "./tiered-paywall-ledger-view.js";
import { newTieredPaywallLedger } from "./tiered-paywall-ledger.js";

test("TieredPaywallLedgerView shows the status in capitals", () => {
  const item = newTieredPaywallLedger("code-357", "name-217");
  const view = toTieredPaywallLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredPaywallLedgerViews([item, item]).length, 2, "views");
});
