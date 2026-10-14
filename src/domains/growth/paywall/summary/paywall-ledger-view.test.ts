import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallLedgerView, toPaywallLedgerViews } from "./paywall-ledger-view.js";
import { newPaywallLedger } from "./paywall-ledger.js";

test("PaywallLedgerView shows the status in capitals", () => {
  const item = newPaywallLedger("code-381", "title-438");
  const view = toPaywallLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallLedgerViews([item, item]).length, 2, "views");
});
