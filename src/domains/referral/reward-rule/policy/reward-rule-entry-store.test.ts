import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleEntryStore } from "./reward-rule-entry-store.js";
import { newRewardRuleEntry } from "./reward-rule-entry.js";

test("MemoryRewardRuleEntryStore finds what it saved", () => {
  const store = newMemoryRewardRuleEntryStore();
  const item = newRewardRuleEntry("code-801", "name-883");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
