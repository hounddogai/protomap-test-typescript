import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortLedgerStore } from "./cohort-ledger-store.js";
import { newCohortLedger } from "./cohort-ledger.js";

test("MemoryCohortLedgerStore finds what it saved", () => {
  const store = newMemoryCohortLedgerStore();
  const item = newCohortLedger("code-261", "name-879");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
