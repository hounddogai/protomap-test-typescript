import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryOptOutLedgerView, toPrimaryOptOutLedgerViews } from "./primary-opt-out-ledger-view.js";
import { newPrimaryOptOutLedger } from "./primary-opt-out-ledger.js";

test("PrimaryOptOutLedgerView shows the status in capitals", () => {
  const item = newPrimaryOptOutLedger("code-239", "title-605");
  const view = toPrimaryOptOutLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryOptOutLedgerViews([item, item]).length, 2, "views");
});
