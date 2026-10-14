import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacySenderAssignmentStore } from "./legacy-sender-assignment-store.js";
import { newLegacySenderAssignment } from "./legacy-sender-assignment.js";

test("MemoryLegacySenderAssignmentStore finds what it saved", () => {
  const store = newMemoryLegacySenderAssignmentStore();
  const item = newLegacySenderAssignment("code-935", "name-651");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
