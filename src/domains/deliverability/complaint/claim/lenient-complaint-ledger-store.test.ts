import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientComplaintLedgerStore } from "./lenient-complaint-ledger-store.js";
import { newLenientComplaintLedger } from "./lenient-complaint-ledger.js";

test("MemoryLenientComplaintLedgerStore finds what it saved", () => {
  const store = newMemoryLenientComplaintLedgerStore();
  const item = newLenientComplaintLedger("code-895", "name-21");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
