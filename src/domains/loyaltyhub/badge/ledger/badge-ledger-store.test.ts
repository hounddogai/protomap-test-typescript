import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeLedgerStore } from "./badge-ledger-store.js";
import { newBadgeLedger } from "./badge-ledger.js";

test("MemoryBadgeLedgerStore finds what it saved", () => {
  const store = newMemoryBadgeLedgerStore();
  const item = newBadgeLedger("code-811", "name-124");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
