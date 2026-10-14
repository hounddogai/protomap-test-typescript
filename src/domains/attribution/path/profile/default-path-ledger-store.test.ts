import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPathLedgerStore } from "./default-path-ledger-store.js";
import { newDefaultPathLedger } from "./default-path-ledger.js";

test("MemoryDefaultPathLedgerStore finds what it saved", () => {
  const store = newMemoryDefaultPathLedgerStore();
  const item = newDefaultPathLedger("code-172", "name-798");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
