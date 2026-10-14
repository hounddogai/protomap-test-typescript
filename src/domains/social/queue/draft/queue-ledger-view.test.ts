import assert from "node:assert/strict";
import { test } from "node:test";
import { toQueueLedgerView, toQueueLedgerViews } from "./queue-ledger-view.js";
import { newQueueLedger } from "./queue-ledger.js";

test("QueueLedgerView shows the status in capitals", () => {
  const item = newQueueLedger("code-236", "title-843");
  const view = toQueueLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toQueueLedgerViews([item, item]).length, 2, "views");
});
