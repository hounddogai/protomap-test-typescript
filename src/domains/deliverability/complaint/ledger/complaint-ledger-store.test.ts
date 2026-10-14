import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintLedgerStore } from "./complaint-ledger-store.js";
import { newComplaintLedger } from "./complaint-ledger.js";

test("MemoryComplaintLedgerStore finds what it saved", () => {
  const store = newMemoryComplaintLedgerStore();
  const item = newComplaintLedger("code-321", "title-685");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
