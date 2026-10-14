import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalBranchLedgerStore } from "./seasonal-branch-ledger-store.js";
import { newSeasonalBranchLedger } from "./seasonal-branch-ledger.js";

test("MemorySeasonalBranchLedgerStore finds what it saved", () => {
  const store = newMemorySeasonalBranchLedgerStore();
  const item = newSeasonalBranchLedger("code-3", "name-293");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
