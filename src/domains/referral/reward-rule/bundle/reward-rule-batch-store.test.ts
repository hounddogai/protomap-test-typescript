import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleBatchStore } from "./reward-rule-batch-store.js";
import { newRewardRuleBatch } from "./reward-rule-batch.js";

test("MemoryRewardRuleBatchStore finds what it saved", () => {
  const store = newMemoryRewardRuleBatchStore();
  const item = newRewardRuleBatch("code-69", "name-765");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
