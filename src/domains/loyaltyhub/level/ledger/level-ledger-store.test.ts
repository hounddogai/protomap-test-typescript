import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelLedgerStore } from "./level-ledger-store.js";
import { newLevelLedger } from "./level-ledger.js";

test("MemoryLevelLedgerStore finds what it saved", () => {
  const store = newMemoryLevelLedgerStore();
  const item = newLevelLedger("code-402", "name-256");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
