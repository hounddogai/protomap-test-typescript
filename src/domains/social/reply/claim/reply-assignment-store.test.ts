import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyAssignmentStore } from "./reply-assignment-store.js";
import { newReplyAssignment } from "./reply-assignment.js";

test("MemoryReplyAssignmentStore finds what it saved", () => {
  const store = newMemoryReplyAssignmentStore();
  const item = newReplyAssignment("code-221", "name-923");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
