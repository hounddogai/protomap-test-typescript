import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackModelLedgerStore } from "./fallback-model-ledger-store.js";
import { newFallbackModelLedger } from "./fallback-model-ledger.js";

test("MemoryFallbackModelLedgerStore finds what it saved", () => {
  const store = newMemoryFallbackModelLedgerStore();
  const item = newFallbackModelLedger("code-661", "name-896");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
