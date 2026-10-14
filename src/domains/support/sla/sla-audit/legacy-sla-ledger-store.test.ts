import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacySlaLedgerStore } from "./legacy-sla-ledger-store.js";
import { newLegacySlaLedger } from "./legacy-sla-ledger.js";

test("MemoryLegacySlaLedgerStore finds what it saved", () => {
  const store = newMemoryLegacySlaLedgerStore();
  const item = newLegacySlaLedger("code-789", "name-547");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
