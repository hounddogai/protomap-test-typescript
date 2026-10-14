import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledQueueLedgerView, toScheduledQueueLedgerViews } from "./scheduled-queue-ledger-view.js";
import { newScheduledQueueLedger } from "./scheduled-queue-ledger.js";

test("ScheduledQueueLedgerView shows the status in capitals", () => {
  const item = newScheduledQueueLedger("code-111", "name-427");
  const view = toScheduledQueueLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledQueueLedgerViews([item, item]).length, 2, "views");
});
