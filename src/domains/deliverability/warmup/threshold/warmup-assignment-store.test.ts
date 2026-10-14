import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupAssignmentStore } from "./warmup-assignment-store.js";
import { newWarmupAssignment } from "./warmup-assignment.js";

test("MemoryWarmupAssignmentStore finds what it saved", () => {
  const store = newMemoryWarmupAssignmentStore();
  const item = newWarmupAssignment("code-990", "title-374");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
