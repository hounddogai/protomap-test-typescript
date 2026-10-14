import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPreferenceMilestoneStore } from "./default-preference-milestone-store.js";
import { newDefaultPreferenceMilestone } from "./default-preference-milestone.js";

test("MemoryDefaultPreferenceMilestoneStore finds what it saved", () => {
  const store = newMemoryDefaultPreferenceMilestoneStore();
  const item = newDefaultPreferenceMilestone("code-119", "title-342");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
