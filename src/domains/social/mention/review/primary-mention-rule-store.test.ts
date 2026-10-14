import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryMentionRuleStore } from "./primary-mention-rule-store.js";
import { newPrimaryMentionRule } from "./primary-mention-rule.js";

test("MemoryPrimaryMentionRuleStore finds what it saved", () => {
  const store = newMemoryPrimaryMentionRuleStore();
  const item = newPrimaryMentionRule("code-706", "name-568");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
