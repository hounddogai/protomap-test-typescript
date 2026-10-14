import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientRewardRuleMilestoneStore } from "./lenient-reward-rule-milestone-store.js";
import { newLenientRewardRuleMilestone } from "./lenient-reward-rule-milestone.js";

test("MemoryLenientRewardRuleMilestoneStore finds what it saved", () => {
  const store = newMemoryLenientRewardRuleMilestoneStore();
  const item = newLenientRewardRuleMilestone("code-51", "title-500");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
