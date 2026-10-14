import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchLedgerView, toBranchLedgerViews } from "./branch-ledger-view.js";
import { newBranchLedger } from "./branch-ledger.js";

test("BranchLedgerView shows the status in capitals", () => {
  const item = newBranchLedger("code-404", "title-164");
  const view = toBranchLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchLedgerViews([item, item]).length, 2, "views");
});
