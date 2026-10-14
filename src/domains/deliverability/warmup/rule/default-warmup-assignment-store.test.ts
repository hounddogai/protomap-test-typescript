import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultWarmupAssignmentStore } from "./default-warmup-assignment-store.js";
import { newDefaultWarmupAssignment } from "./default-warmup-assignment.js";

test("MemoryDefaultWarmupAssignmentStore finds what it saved", () => {
  const store = newMemoryDefaultWarmupAssignmentStore();
  const item = newDefaultWarmupAssignment("code-563", "title-429");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
