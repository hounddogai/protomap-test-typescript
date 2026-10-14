import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalRedemptionLedgerStore } from "./global-redemption-ledger-store.js";
import { newGlobalRedemptionLedger } from "./global-redemption-ledger.js";

test("MemoryGlobalRedemptionLedgerStore finds what it saved", () => {
  const store = newMemoryGlobalRedemptionLedgerStore();
  const item = newGlobalRedemptionLedger("code-859", "label-934");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
