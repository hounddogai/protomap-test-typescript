import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingExitRuleLedgerStore } from "./rolling-exit-rule-ledger-store.js";
import { newRollingExitRuleLedger } from "./rolling-exit-rule-ledger.js";

test("MemoryRollingExitRuleLedgerStore finds what it saved", () => {
  const store = newMemoryRollingExitRuleLedgerStore();
  const item = newRollingExitRuleLedger("code-831", "name-599");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
