import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaLedgerStore } from "./sla-ledger-store.js";
import { newSlaLedger } from "./sla-ledger.js";

test("MemorySlaLedgerStore finds what it saved", () => {
  const store = newMemorySlaLedgerStore();
  const item = newSlaLedger("code-851", "name-731");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
