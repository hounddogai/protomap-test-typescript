import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingLedgerView, toPacingLedgerViews } from "./pacing-ledger-view.js";
import { newPacingLedger } from "./pacing-ledger.js";

test("PacingLedgerView shows the status in capitals", () => {
  const item = newPacingLedger("code-626", "name-362");
  const view = toPacingLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingLedgerViews([item, item]).length, 2, "views");
});
