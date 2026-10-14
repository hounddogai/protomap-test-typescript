import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutLedgerView, toOptOutLedgerViews } from "./opt-out-ledger-view.js";
import { newOptOutLedger } from "./opt-out-ledger.js";

test("OptOutLedgerView shows the status in capitals", () => {
  const item = newOptOutLedger("code-656", "name-769");
  const view = toOptOutLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutLedgerViews([item, item]).length, 2, "views");
});
