import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredExitRuleEntryStore } from "./tiered-exit-rule-entry-store.js";
import { newTieredExitRuleEntry } from "./tiered-exit-rule-entry.js";

test("MemoryTieredExitRuleEntryStore finds what it saved", () => {
  const store = newMemoryTieredExitRuleEntryStore();
  const item = newTieredExitRuleEntry("code-480", "title-897");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
