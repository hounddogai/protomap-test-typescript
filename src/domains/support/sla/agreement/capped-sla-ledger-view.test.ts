import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedSlaLedgerView, toCappedSlaLedgerViews } from "./capped-sla-ledger-view.js";
import { newCappedSlaLedger } from "./capped-sla-ledger.js";

test("CappedSlaLedgerView shows the status in capitals", () => {
  const item = newCappedSlaLedger("code-934", "label-942");
  const view = toCappedSlaLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedSlaLedgerViews([item, item]).length, 2, "views");
});
