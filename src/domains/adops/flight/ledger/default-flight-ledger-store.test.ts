import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultFlightLedgerStore } from "./default-flight-ledger-store.js";
import { newDefaultFlightLedger } from "./default-flight-ledger.js";

test("MemoryDefaultFlightLedgerStore finds what it saved", () => {
  const store = newMemoryDefaultFlightLedgerStore();
  const item = newDefaultFlightLedger("code-900", "label-50");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
