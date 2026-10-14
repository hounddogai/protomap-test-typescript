import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatLedgerView, toCsatLedgerViews } from "./csat-ledger-view.js";
import { newCsatLedger } from "./csat-ledger.js";

test("CsatLedgerView shows the status in capitals", () => {
  const item = newCsatLedger("code-893", "name-684");
  const view = toCsatLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatLedgerViews([item, item]).length, 2, "views");
});
