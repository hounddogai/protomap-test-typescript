import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDeflectionLedgerStore } from "./legacy-deflection-ledger-store.js";
import { newLegacyDeflectionLedger } from "./legacy-deflection-ledger.js";

test("MemoryLegacyDeflectionLedgerStore finds what it saved", () => {
  const store = newMemoryLegacyDeflectionLedgerStore();
  const item = newLegacyDeflectionLedger("code-989", "label-573");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
