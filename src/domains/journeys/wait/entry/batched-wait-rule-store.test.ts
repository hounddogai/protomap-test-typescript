import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedWaitRuleStore } from "./batched-wait-rule-store.js";
import { newBatchedWaitRule } from "./batched-wait-rule.js";

test("MemoryBatchedWaitRuleStore finds what it saved", () => {
  const store = newMemoryBatchedWaitRuleStore();
  const item = newBatchedWaitRule("code-137", "title-587");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
