import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPreferenceMilestoneStore } from "./strict-preference-milestone-store.js";
import { newStrictPreferenceMilestone } from "./strict-preference-milestone.js";

test("MemoryStrictPreferenceMilestoneStore finds what it saved", () => {
  const store = newMemoryStrictPreferenceMilestoneStore();
  const item = newStrictPreferenceMilestone("code-568", "name-413");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
