import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeAssignmentStore } from "./challenge-assignment-store.js";
import { newChallengeAssignment } from "./challenge-assignment.js";

test("MemoryChallengeAssignmentStore finds what it saved", () => {
  const store = newMemoryChallengeAssignmentStore();
  const item = newChallengeAssignment("code-785", "name-561");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
