import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalQueueRuleStore } from "./regional-queue-rule-store.js";
import { newRegionalQueueRule } from "./regional-queue-rule.js";

test("MemoryRegionalQueueRuleStore finds what it saved", () => {
  const store = newMemoryRegionalQueueRuleStore();
  const item = newRegionalQueueRule("code-6", "name-241");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
