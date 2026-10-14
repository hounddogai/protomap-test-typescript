import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultBranchLedgerStore } from "./default-branch-ledger-store.js";
import { newDefaultBranchLedger } from "./default-branch-ledger.js";

test("MemoryDefaultBranchLedgerStore finds what it saved", () => {
  const store = newMemoryDefaultBranchLedgerStore();
  const item = newDefaultBranchLedger("code-481", "title-183");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
