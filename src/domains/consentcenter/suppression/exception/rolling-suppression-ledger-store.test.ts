import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingSuppressionLedgerStore } from "./rolling-suppression-ledger-store.js";
import { newRollingSuppressionLedger } from "./rolling-suppression-ledger.js";

test("MemoryRollingSuppressionLedgerStore finds what it saved", () => {
  const store = newMemoryRollingSuppressionLedgerStore();
  const item = newRollingSuppressionLedger("code-922", "label-475");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
