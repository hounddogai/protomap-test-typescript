import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackFlightLedgerStore } from "./fallback-flight-ledger-store.js";
import { newFallbackFlightLedger } from "./fallback-flight-ledger.js";

test("MemoryFallbackFlightLedgerStore finds what it saved", () => {
  const store = newMemoryFallbackFlightLedgerStore();
  const item = newFallbackFlightLedger("code-217", "title-668");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
