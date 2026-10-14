import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyActivationLedgerStore } from "./legacy-activation-ledger-store.js";
import { newLegacyActivationLedger } from "./legacy-activation-ledger.js";

test("MemoryLegacyActivationLedgerStore finds what it saved", () => {
  const store = newMemoryLegacyActivationLedgerStore();
  const item = newLegacyActivationLedger("code-40", "title-521");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
