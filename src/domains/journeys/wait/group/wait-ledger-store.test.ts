import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitLedgerStore } from "./wait-ledger-store.js";
import { newWaitLedger } from "./wait-ledger.js";

test("MemoryWaitLedgerStore finds what it saved", () => {
  const store = newMemoryWaitLedgerStore();
  const item = newWaitLedger("code-82", "name-835");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
