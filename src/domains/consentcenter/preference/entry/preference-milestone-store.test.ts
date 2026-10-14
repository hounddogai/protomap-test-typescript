import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceMilestoneStore } from "./preference-milestone-store.js";
import { newPreferenceMilestone } from "./preference-milestone.js";

test("MemoryPreferenceMilestoneStore finds what it saved", () => {
  const store = newMemoryPreferenceMilestoneStore();
  const item = newPreferenceMilestone("code-282", "name-517");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
