import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionMilestoneStore } from "./mention-milestone-store.js";
import { newMentionMilestone } from "./mention-milestone.js";

test("MemoryMentionMilestoneStore finds what it saved", () => {
  const store = newMemoryMentionMilestoneStore();
  const item = newMentionMilestone("code-380", "label-215");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
