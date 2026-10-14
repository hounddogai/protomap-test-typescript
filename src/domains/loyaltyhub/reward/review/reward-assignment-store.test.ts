import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardAssignmentStore } from "./reward-assignment-store.js";
import { newRewardAssignment } from "./reward-assignment.js";

test("MemoryRewardAssignmentStore finds what it saved", () => {
  const store = newMemoryRewardAssignmentStore();
  const item = newRewardAssignment("code-296", "label-388");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
