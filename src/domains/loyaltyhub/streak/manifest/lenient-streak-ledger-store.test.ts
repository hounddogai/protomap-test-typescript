import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientStreakLedgerStore } from "./lenient-streak-ledger-store.js";
import { newLenientStreakLedger } from "./lenient-streak-ledger.js";

test("MemoryLenientStreakLedgerStore finds what it saved", () => {
  const store = newMemoryLenientStreakLedgerStore();
  const item = newLenientStreakLedger("code-55", "title-275");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
