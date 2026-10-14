import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveRewardRuleEntryStore } from "./adaptive-reward-rule-entry-store.js";
import { newAdaptiveRewardRuleEntry } from "./adaptive-reward-rule-entry.js";

test("MemoryAdaptiveRewardRuleEntryStore finds what it saved", () => {
  const store = newMemoryAdaptiveRewardRuleEntryStore();
  const item = newAdaptiveRewardRuleEntry("code-181", "label-849");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
