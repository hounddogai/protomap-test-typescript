import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientPayoutLedgerView, toLenientPayoutLedgerViews } from "./lenient-payout-ledger-view.js";
import { newLenientPayoutLedger } from "./lenient-payout-ledger.js";

test("LenientPayoutLedgerView shows the status in capitals", () => {
  const item = newLenientPayoutLedger("code-532", "title-665");
  const view = toLenientPayoutLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientPayoutLedgerViews([item, item]).length, 2, "views");
});
