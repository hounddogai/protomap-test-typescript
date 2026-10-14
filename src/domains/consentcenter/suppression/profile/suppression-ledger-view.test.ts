import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionLedgerView, toSuppressionLedgerViews } from "./suppression-ledger-view.js";
import { newSuppressionLedger } from "./suppression-ledger.js";

test("SuppressionLedgerView shows the status in capitals", () => {
  const item = newSuppressionLedger("code-568", "label-752");
  const view = toSuppressionLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionLedgerViews([item, item]).length, 2, "views");
});
