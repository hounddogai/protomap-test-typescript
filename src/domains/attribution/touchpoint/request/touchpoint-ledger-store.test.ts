import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointLedgerStore } from "./touchpoint-ledger-store.js";
import { newTouchpointLedger } from "./touchpoint-ledger.js";

test("MemoryTouchpointLedgerStore finds what it saved", () => {
  const store = newMemoryTouchpointLedgerStore();
  const item = newTouchpointLedger("code-752", "title-876");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
