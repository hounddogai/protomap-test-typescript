import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryOptOutLedgerStore } from "./primary-opt-out-ledger-store.js";
import { newPrimaryOptOutLedger } from "./primary-opt-out-ledger.js";

test("MemoryPrimaryOptOutLedgerStore finds what it saved", () => {
  const store = newMemoryPrimaryOptOutLedgerStore();
  const item = newPrimaryOptOutLedger("code-239", "title-605");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
