import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingPlacementLedgerStore } from "./rolling-placement-ledger-store.js";
import { newRollingPlacementLedger } from "./rolling-placement-ledger.js";

test("MemoryRollingPlacementLedgerStore finds what it saved", () => {
  const store = newMemoryRollingPlacementLedgerStore();
  const item = newRollingPlacementLedger("code-443", "name-485");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
