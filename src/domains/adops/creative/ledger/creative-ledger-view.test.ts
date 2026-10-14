import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeLedgerView, toCreativeLedgerViews } from "./creative-ledger-view.js";
import { newCreativeLedger } from "./creative-ledger.js";

test("CreativeLedgerView shows the status in capitals", () => {
  const item = newCreativeLedger("code-741", "title-366");
  const view = toCreativeLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeLedgerViews([item, item]).length, 2, "views");
});
