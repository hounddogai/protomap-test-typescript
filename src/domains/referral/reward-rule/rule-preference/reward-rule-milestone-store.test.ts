import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleMilestoneStore } from "./reward-rule-milestone-store.js";
import { newRewardRuleMilestone } from "./reward-rule-milestone.js";

test("MemoryRewardRuleMilestoneStore finds what it saved", () => {
  const store = newMemoryRewardRuleMilestoneStore();
  const item = newRewardRuleMilestone("code-806", "title-577");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
