import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryInsightLedgerStore } from "./primary-insight-ledger-store.js";
import { newPrimaryInsightLedger } from "./primary-insight-ledger.js";

test("MemoryPrimaryInsightLedgerStore finds what it saved", () => {
  const store = newMemoryPrimaryInsightLedgerStore();
  const item = newPrimaryInsightLedger("code-448", "name-551");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
