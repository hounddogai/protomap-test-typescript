import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalPayoutLedgerStore } from "./seasonal-payout-ledger-store.js";
import { newSeasonalPayoutLedger } from "./seasonal-payout-ledger.js";

test("MemorySeasonalPayoutLedgerStore finds what it saved", () => {
  const store = newMemorySeasonalPayoutLedgerStore();
  const item = newSeasonalPayoutLedger("code-22", "title-148");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
