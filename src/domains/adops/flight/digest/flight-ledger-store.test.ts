import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightLedgerStore } from "./flight-ledger-store.js";
import { newFlightLedger } from "./flight-ledger.js";

test("MemoryFlightLedgerStore finds what it saved", () => {
  const store = newMemoryFlightLedgerStore();
  const item = newFlightLedger("code-292", "title-685");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
