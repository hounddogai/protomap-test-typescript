import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelMilestoneStore } from "./model-milestone-store.js";
import { newModelMilestone } from "./model-milestone.js";

test("MemoryModelMilestoneStore finds what it saved", () => {
  const store = newMemoryModelMilestoneStore();
  const item = newModelMilestone("code-821", "name-625");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
