import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDomainLedgerStore } from "./legacy-domain-ledger-store.js";
import { newLegacyDomainLedger } from "./legacy-domain-ledger.js";

test("MemoryLegacyDomainLedgerStore finds what it saved", () => {
  const store = newMemoryLegacyDomainLedgerStore();
  const item = newLegacyDomainLedger("code-623", "label-137");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
