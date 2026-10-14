import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredDomainLedgerStore } from "./tiered-domain-ledger-store.js";
import { newTieredDomainLedger } from "./tiered-domain-ledger.js";

test("MemoryTieredDomainLedgerStore finds what it saved", () => {
  const store = newMemoryTieredDomainLedgerStore();
  const item = newTieredDomainLedger("code-979", "name-260");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
