import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedPathMilestoneStore } from "./capped-path-milestone-store.js";
import { newCappedPathMilestone } from "./capped-path-milestone.js";

test("MemoryCappedPathMilestoneStore finds what it saved", () => {
  const store = newMemoryCappedPathMilestoneStore();
  const item = newCappedPathMilestone("code-119", "label-770");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
