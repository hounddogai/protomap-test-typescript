import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeLedgerStore } from "./creative-ledger-store.js";
import { newCreativeLedger } from "./creative-ledger.js";

test("MemoryCreativeLedgerStore finds what it saved", () => {
  const store = newMemoryCreativeLedgerStore();
  const item = newCreativeLedger("code-741", "title-366");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
