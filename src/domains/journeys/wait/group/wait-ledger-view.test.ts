import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitLedgerView, toWaitLedgerViews } from "./wait-ledger-view.js";
import { newWaitLedger } from "./wait-ledger.js";

test("WaitLedgerView shows the status in capitals", () => {
  const item = newWaitLedger("code-82", "name-835");
  const view = toWaitLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitLedgerViews([item, item]).length, 2, "views");
});
