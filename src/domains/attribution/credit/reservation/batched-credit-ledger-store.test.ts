import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedCreditLedgerStore } from "./batched-credit-ledger-store.js";
import { newBatchedCreditLedger } from "./batched-credit-ledger.js";

test("MemoryBatchedCreditLedgerStore finds what it saved", () => {
  const store = newMemoryBatchedCreditLedgerStore();
  const item = newBatchedCreditLedger("code-135", "label-260");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
