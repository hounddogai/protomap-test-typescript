import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionLedgerStore } from "./deflection-ledger-store.js";
import { newDeflectionLedger } from "./deflection-ledger.js";

test("MemoryDeflectionLedgerStore finds what it saved", () => {
  const store = newMemoryDeflectionLedgerStore();
  const item = newDeflectionLedger("code-361", "name-709");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
