import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPlacementLedgerStore } from "./tiered-placement-ledger-store.js";
import { newTieredPlacementLedger } from "./tiered-placement-ledger.js";

test("MemoryTieredPlacementLedgerStore finds what it saved", () => {
  const store = newMemoryTieredPlacementLedgerStore();
  const item = newTieredPlacementLedger("code-510", "label-281");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
