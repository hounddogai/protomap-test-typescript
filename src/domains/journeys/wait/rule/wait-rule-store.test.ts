import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitRuleStore } from "./wait-rule-store.js";
import { newWaitRule } from "./wait-rule.js";

test("MemoryWaitRuleStore finds what it saved", () => {
  const store = newMemoryWaitRuleStore();
  const item = newWaitRule("code-707", "title-914");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
