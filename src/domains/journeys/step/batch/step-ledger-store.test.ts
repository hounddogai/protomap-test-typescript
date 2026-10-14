import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepLedgerStore } from "./step-ledger-store.js";
import { newStepLedger } from "./step-ledger.js";

test("MemoryStepLedgerStore finds what it saved", () => {
  const store = newMemoryStepLedgerStore();
  const item = newStepLedger("code-691", "name-246");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
