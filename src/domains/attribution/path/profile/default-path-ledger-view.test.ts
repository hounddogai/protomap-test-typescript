import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultPathLedgerView, toDefaultPathLedgerViews } from "./default-path-ledger-view.js";
import { newDefaultPathLedger } from "./default-path-ledger.js";

test("DefaultPathLedgerView shows the status in capitals", () => {
  const item = newDefaultPathLedger("code-172", "name-798");
  const view = toDefaultPathLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultPathLedgerViews([item, item]).length, 2, "views");
});
