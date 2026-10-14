import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalWindowLedgerStore } from "./global-window-ledger-store.js";
import { newGlobalWindowLedger } from "./global-window-ledger.js";

test("MemoryGlobalWindowLedgerStore finds what it saved", () => {
  const store = newMemoryGlobalWindowLedgerStore();
  const item = newGlobalWindowLedger("code-204", "title-579");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
