import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultSenderRuleStore } from "./default-sender-rule-store.js";
import { newDefaultSenderRule } from "./default-sender-rule.js";

test("MemoryDefaultSenderRuleStore finds what it saved", () => {
  const store = newMemoryDefaultSenderRuleStore();
  const item = newDefaultSenderRule("code-759", "name-487");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
