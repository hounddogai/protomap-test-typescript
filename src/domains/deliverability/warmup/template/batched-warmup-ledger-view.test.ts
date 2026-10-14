import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedWarmupLedgerView, toBatchedWarmupLedgerViews } from "./batched-warmup-ledger-view.js";
import { newBatchedWarmupLedger } from "./batched-warmup-ledger.js";

test("BatchedWarmupLedgerView shows the status in capitals", () => {
  const item = newBatchedWarmupLedger("code-984", "title-268");
  const view = toBatchedWarmupLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedWarmupLedgerViews([item, item]).length, 2, "views");
});
