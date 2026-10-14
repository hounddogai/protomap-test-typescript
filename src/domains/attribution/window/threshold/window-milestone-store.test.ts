import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowMilestoneStore } from "./window-milestone-store.js";
import { newWindowMilestone } from "./window-milestone.js";

test("MemoryWindowMilestoneStore finds what it saved", () => {
  const store = newMemoryWindowMilestoneStore();
  const item = newWindowMilestone("code-620", "label-96");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
