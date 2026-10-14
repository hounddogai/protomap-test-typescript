import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionRuleStore } from "./retention-rule-store.js";
import { newRetentionRule } from "./retention-rule.js";

test("MemoryRetentionRuleStore finds what it saved", () => {
  const store = newMemoryRetentionRuleStore();
  const item = newRetentionRule("code-868", "name-228");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
