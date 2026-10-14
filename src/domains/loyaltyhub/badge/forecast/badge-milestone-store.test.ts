import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeMilestoneStore } from "./badge-milestone-store.js";
import { newBadgeMilestone } from "./badge-milestone.js";

test("MemoryBadgeMilestoneStore finds what it saved", () => {
  const store = newMemoryBadgeMilestoneStore();
  const item = newBadgeMilestone("code-274", "name-231");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
