import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultMentionRuleStore } from "./default-mention-rule-store.js";
import { newDefaultMentionRule } from "./default-mention-rule.js";

test("MemoryDefaultMentionRuleStore finds what it saved", () => {
  const store = newMemoryDefaultMentionRuleStore();
  const item = newDefaultMentionRule("code-746", "label-323");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
