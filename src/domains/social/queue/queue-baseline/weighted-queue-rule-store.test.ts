import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedQueueRuleStore } from "./weighted-queue-rule-store.js";
import { newWeightedQueueRule } from "./weighted-queue-rule.js";

test("MemoryWeightedQueueRuleStore finds what it saved", () => {
  const store = newMemoryWeightedQueueRuleStore();
  const item = newWeightedQueueRule("code-427", "title-114");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
