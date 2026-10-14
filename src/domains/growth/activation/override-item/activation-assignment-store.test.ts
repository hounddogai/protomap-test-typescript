import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationAssignmentStore } from "./activation-assignment-store.js";
import { newActivationAssignment } from "./activation-assignment.js";

test("MemoryActivationAssignmentStore finds what it saved", () => {
  const store = newMemoryActivationAssignmentStore();
  const item = newActivationAssignment("code-249", "name-773");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
