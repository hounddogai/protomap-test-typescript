import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleMilestoneStore } from "./exit-rule-milestone-store.js";
import { newExitRuleMilestone } from "./exit-rule-milestone.js";

test("MemoryExitRuleMilestoneStore finds what it saved", () => {
  const store = newMemoryExitRuleMilestoneStore();
  const item = newExitRuleMilestone("code-70", "label-249");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
