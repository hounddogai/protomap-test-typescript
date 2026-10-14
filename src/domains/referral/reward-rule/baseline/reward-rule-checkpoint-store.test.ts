import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleCheckpointStore } from "./reward-rule-checkpoint-store.js";
import { newRewardRuleCheckpoint } from "./reward-rule-checkpoint.js";

test("MemoryRewardRuleCheckpointStore finds what it saved", () => {
  const store = newMemoryRewardRuleCheckpointStore();
  const item = newRewardRuleCheckpoint("code-328", "name-140");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
