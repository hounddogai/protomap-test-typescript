import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalLedgerStore } from "./approval-ledger-store.js";
import { newApprovalLedger } from "./approval-ledger.js";

test("MemoryApprovalLedgerStore finds what it saved", () => {
  const store = newMemoryApprovalLedgerStore();
  const item = newApprovalLedger("code-351", "name-348");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
