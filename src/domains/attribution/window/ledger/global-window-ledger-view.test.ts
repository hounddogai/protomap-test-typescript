import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalWindowLedgerView, toGlobalWindowLedgerViews } from "./global-window-ledger-view.js";
import { newGlobalWindowLedger } from "./global-window-ledger.js";

test("GlobalWindowLedgerView shows the status in capitals", () => {
  const item = newGlobalWindowLedger("code-204", "title-579");
  const view = toGlobalWindowLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalWindowLedgerViews([item, item]).length, 2, "views");
});
