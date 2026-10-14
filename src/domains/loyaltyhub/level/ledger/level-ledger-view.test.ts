import assert from "node:assert/strict";
import { test } from "node:test";
import { toLevelLedgerView, toLevelLedgerViews } from "./level-ledger-view.js";
import { newLevelLedger } from "./level-ledger.js";

test("LevelLedgerView shows the status in capitals", () => {
  const item = newLevelLedger("code-402", "name-256");
  const view = toLevelLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLevelLedgerViews([item, item]).length, 2, "views");
});
