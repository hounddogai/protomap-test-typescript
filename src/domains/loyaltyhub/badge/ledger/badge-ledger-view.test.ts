import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeLedgerView, toBadgeLedgerViews } from "./badge-ledger-view.js";
import { newBadgeLedger } from "./badge-ledger.js";

test("BadgeLedgerView shows the status in capitals", () => {
  const item = newBadgeLedger("code-811", "name-124");
  const view = toBadgeLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeLedgerViews([item, item]).length, 2, "views");
});
