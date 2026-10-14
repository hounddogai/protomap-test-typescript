import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionMilestoneStore } from "./retention-milestone-store.js";
import { newRetentionMilestone } from "./retention-milestone.js";

test("MemoryRetentionMilestoneStore finds what it saved", () => {
  const store = newMemoryRetentionMilestoneStore();
  const item = newRetentionMilestone("code-880", "label-532");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
