import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDoubleOptInLedgerStore } from "./legacy-double-opt-in-ledger-store.js";
import { newLegacyDoubleOptInLedger } from "./legacy-double-opt-in-ledger.js";

test("MemoryLegacyDoubleOptInLedgerStore finds what it saved", () => {
  const store = newMemoryLegacyDoubleOptInLedgerStore();
  const item = newLegacyDoubleOptInLedger("code-689", "title-674");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
