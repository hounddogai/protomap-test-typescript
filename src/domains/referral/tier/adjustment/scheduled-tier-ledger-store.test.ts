import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledTierLedgerStore } from "./scheduled-tier-ledger-store.js";
import { newScheduledTierLedger } from "./scheduled-tier-ledger.js";

test("MemoryScheduledTierLedgerStore finds what it saved", () => {
  const store = newMemoryScheduledTierLedgerStore();
  const item = newScheduledTierLedger("code-749", "name-250");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
