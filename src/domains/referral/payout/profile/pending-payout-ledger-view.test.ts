import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingPayoutLedgerView, toPendingPayoutLedgerViews } from "./pending-payout-ledger-view.js";
import { newPendingPayoutLedger } from "./pending-payout-ledger.js";

test("PendingPayoutLedgerView shows the status in capitals", () => {
  const item = newPendingPayoutLedger("code-230", "label-275");
  const view = toPendingPayoutLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingPayoutLedgerViews([item, item]).length, 2, "views");
});
