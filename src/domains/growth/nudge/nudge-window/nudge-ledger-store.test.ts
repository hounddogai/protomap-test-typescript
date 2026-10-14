import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeLedgerStore } from "./nudge-ledger-store.js";
import { newNudgeLedger } from "./nudge-ledger.js";

test("MemoryNudgeLedgerStore finds what it saved", () => {
  const store = newMemoryNudgeLedgerStore();
  const item = newNudgeLedger("code-738", "title-46");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
