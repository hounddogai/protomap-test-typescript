import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionLedgerView, toDeflectionLedgerViews } from "./deflection-ledger-view.js";
import { newDeflectionLedger } from "./deflection-ledger.js";

test("DeflectionLedgerView shows the status in capitals", () => {
  const item = newDeflectionLedger("code-361", "name-709");
  const view = toDeflectionLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionLedgerViews([item, item]).length, 2, "views");
});
