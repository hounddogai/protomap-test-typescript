import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedDeflectionAssignmentStore } from "./weighted-deflection-assignment-store.js";
import { newWeightedDeflectionAssignment } from "./weighted-deflection-assignment.js";

test("MemoryWeightedDeflectionAssignmentStore finds what it saved", () => {
  const store = newMemoryWeightedDeflectionAssignmentStore();
  const item = newWeightedDeflectionAssignment("code-995", "label-64");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
