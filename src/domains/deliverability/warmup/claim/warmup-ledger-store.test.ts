import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupLedgerStore } from "./warmup-ledger-store.js";
import { newWarmupLedger } from "./warmup-ledger.js";

test("MemoryWarmupLedgerStore finds what it saved", () => {
  const store = newMemoryWarmupLedgerStore();
  const item = newWarmupLedger("code-927", "name-610");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
