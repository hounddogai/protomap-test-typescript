import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyRuleStore } from "./reply-rule-store.js";
import { newReplyRule } from "./reply-rule.js";

test("MemoryReplyRuleStore finds what it saved", () => {
  const store = newMemoryReplyRuleStore();
  const item = newReplyRule("code-526", "title-700");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
