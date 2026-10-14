import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalPaywallLedgerView, toRegionalPaywallLedgerViews } from "./regional-paywall-ledger-view.js";
import { newRegionalPaywallLedger } from "./regional-paywall-ledger.js";

test("RegionalPaywallLedgerView shows the status in capitals", () => {
  const item = newRegionalPaywallLedger("code-155", "label-775");
  const view = toRegionalPaywallLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalPaywallLedgerViews([item, item]).length, 2, "views");
});
