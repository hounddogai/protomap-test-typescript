import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceLedgerView, toPreferenceLedgerViews } from "./preference-ledger-view.js";
import { newPreferenceLedger } from "./preference-ledger.js";

test("PreferenceLedgerView shows the status in capitals", () => {
  const item = newPreferenceLedger("code-439", "title-62");
  const view = toPreferenceLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceLedgerViews([item, item]).length, 2, "views");
});
