import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveComplaintLedgerStore } from "./adaptive-complaint-ledger-store.js";
import { newAdaptiveComplaintLedger } from "./adaptive-complaint-ledger.js";

test("MemoryAdaptiveComplaintLedgerStore finds what it saved", () => {
  const store = newMemoryAdaptiveComplaintLedgerStore();
  const item = newAdaptiveComplaintLedger("code-715", "title-780");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
