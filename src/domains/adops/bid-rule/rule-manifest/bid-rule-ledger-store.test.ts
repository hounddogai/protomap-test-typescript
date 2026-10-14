import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleLedgerStore } from "./bid-rule-ledger-store.js";
import { newBidRuleLedger } from "./bid-rule-ledger.js";

test("MemoryBidRuleLedgerStore finds what it saved", () => {
  const store = newMemoryBidRuleLedgerStore();
  const item = newBidRuleLedger("code-295", "label-281");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
