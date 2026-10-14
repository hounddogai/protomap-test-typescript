import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualCreditLedgerView, toManualCreditLedgerViews } from "./manual-credit-ledger-view.js";
import { newManualCreditLedger } from "./manual-credit-ledger.js";

test("ManualCreditLedgerView shows the status in capitals", () => {
  const item = newManualCreditLedger("code-232", "label-466");
  const view = toManualCreditLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualCreditLedgerViews([item, item]).length, 2, "views");
});
