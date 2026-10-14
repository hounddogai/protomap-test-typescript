import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedMentionLedgerView, toBatchedMentionLedgerViews } from "./batched-mention-ledger-view.js";
import { newBatchedMentionLedger } from "./batched-mention-ledger.js";

test("BatchedMentionLedgerView shows the status in capitals", () => {
  const item = newBatchedMentionLedger("code-398", "label-877");
  const view = toBatchedMentionLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedMentionLedgerViews([item, item]).length, 2, "views");
});
