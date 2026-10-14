import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceLedgerStore } from "./preference-ledger-store.js";
import { newPreferenceLedger } from "./preference-ledger.js";

test("MemoryPreferenceLedgerStore finds what it saved", () => {
  const store = newMemoryPreferenceLedgerStore();
  const item = newPreferenceLedger("code-439", "title-62");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
