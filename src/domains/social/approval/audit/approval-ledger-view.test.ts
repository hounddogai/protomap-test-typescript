import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalLedgerView, toApprovalLedgerViews } from "./approval-ledger-view.js";
import { newApprovalLedger } from "./approval-ledger.js";

test("ApprovalLedgerView shows the status in capitals", () => {
  const item = newApprovalLedger("code-351", "name-348");
  const view = toApprovalLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalLedgerViews([item, item]).length, 2, "views");
});
