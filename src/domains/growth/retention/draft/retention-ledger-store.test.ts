import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionLedgerStore } from "./retention-ledger-store.js";
import { newRetentionLedger } from "./retention-ledger.js";

test("MemoryRetentionLedgerStore finds what it saved", () => {
  const store = newMemoryRetentionLedgerStore();
  const item = newRetentionLedger("code-480", "name-573");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
