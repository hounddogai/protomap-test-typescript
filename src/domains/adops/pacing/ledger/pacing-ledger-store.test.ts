import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingLedgerStore } from "./pacing-ledger-store.js";
import { newPacingLedger } from "./pacing-ledger.js";

test("MemoryPacingLedgerStore finds what it saved", () => {
  const store = newMemoryPacingLedgerStore();
  const item = newPacingLedger("code-626", "name-362");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
