import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionLedgerView, toRetentionLedgerViews } from "./retention-ledger-view.js";
import { newRetentionLedger } from "./retention-ledger.js";

test("RetentionLedgerView shows the status in capitals", () => {
  const item = newRetentionLedger("code-480", "name-573");
  const view = toRetentionLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionLedgerViews([item, item]).length, 2, "views");
});
