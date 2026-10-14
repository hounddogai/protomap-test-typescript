import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalReputationLedgerStore } from "./seasonal-reputation-ledger-store.js";
import { newSeasonalReputationLedger } from "./seasonal-reputation-ledger.js";

test("MemorySeasonalReputationLedgerStore finds what it saved", () => {
  const store = newMemorySeasonalReputationLedgerStore();
  const item = newSeasonalReputationLedger("code-675", "label-598");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
