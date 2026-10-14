import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyLedgerStore } from "./frequency-ledger-store.js";
import { newFrequencyLedger } from "./frequency-ledger.js";

test("MemoryFrequencyLedgerStore finds what it saved", () => {
  const store = newMemoryFrequencyLedgerStore();
  const item = newFrequencyLedger("code-630", "title-597");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
