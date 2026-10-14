import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditLedgerStore } from "./credit-ledger-store.js";
import { newCreditLedger } from "./credit-ledger.js";

test("MemoryCreditLedgerStore finds what it saved", () => {
  const store = newMemoryCreditLedgerStore();
  const item = newCreditLedger("code-951", "name-96");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
