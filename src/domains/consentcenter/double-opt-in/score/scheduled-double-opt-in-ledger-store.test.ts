import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledDoubleOptInLedgerStore } from "./scheduled-double-opt-in-ledger-store.js";
import { newScheduledDoubleOptInLedger } from "./scheduled-double-opt-in-ledger.js";

test("MemoryScheduledDoubleOptInLedgerStore finds what it saved", () => {
  const store = newMemoryScheduledDoubleOptInLedgerStore();
  const item = newScheduledDoubleOptInLedger("code-325", "title-61");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
