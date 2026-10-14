import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationLedgerStore } from "./reputation-ledger-store.js";
import { newReputationLedger } from "./reputation-ledger.js";

test("MemoryReputationLedgerStore finds what it saved", () => {
  const store = newMemoryReputationLedgerStore();
  const item = newReputationLedger("code-288", "label-869");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
