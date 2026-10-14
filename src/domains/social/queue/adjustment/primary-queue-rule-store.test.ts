import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryQueueRuleStore } from "./primary-queue-rule-store.js";
import { newPrimaryQueueRule } from "./primary-queue-rule.js";

test("MemoryPrimaryQueueRuleStore finds what it saved", () => {
  const store = newMemoryPrimaryQueueRuleStore();
  const item = newPrimaryQueueRule("code-67", "name-780");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
