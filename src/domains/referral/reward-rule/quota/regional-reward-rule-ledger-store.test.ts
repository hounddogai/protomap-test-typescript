import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalRewardRuleLedgerStore } from "./regional-reward-rule-ledger-store.js";
import { newRegionalRewardRuleLedger } from "./regional-reward-rule-ledger.js";

test("MemoryRegionalRewardRuleLedgerStore finds what it saved", () => {
  const store = newMemoryRegionalRewardRuleLedgerStore();
  const item = newRegionalRewardRuleLedger("code-188", "label-916");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
