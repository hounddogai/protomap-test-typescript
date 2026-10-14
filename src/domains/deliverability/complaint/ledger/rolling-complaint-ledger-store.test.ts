import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingComplaintLedgerStore } from "./rolling-complaint-ledger-store.js";
import { newRollingComplaintLedger } from "./rolling-complaint-ledger.js";

test("MemoryRollingComplaintLedgerStore finds what it saved", () => {
  const store = newMemoryRollingComplaintLedgerStore();
  const item = newRollingComplaintLedger("code-104", "label-205");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
