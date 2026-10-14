import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostMilestoneStore } from "./post-milestone-store.js";
import { newPostMilestone } from "./post-milestone.js";

test("MemoryPostMilestoneStore finds what it saved", () => {
  const store = newMemoryPostMilestoneStore();
  const item = newPostMilestone("code-150", "name-921");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
