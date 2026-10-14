import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientFrequencyLedgerStore } from "./lenient-frequency-ledger-store.js";
import { newLenientFrequencyLedger } from "./lenient-frequency-ledger.js";

test("MemoryLenientFrequencyLedgerStore finds what it saved", () => {
  const store = newMemoryLenientFrequencyLedgerStore();
  const item = newLenientFrequencyLedger("code-24", "name-314");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
