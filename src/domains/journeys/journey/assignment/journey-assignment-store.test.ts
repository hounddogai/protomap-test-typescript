import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyAssignmentStore } from "./journey-assignment-store.js";
import { newJourneyAssignment } from "./journey-assignment.js";

test("MemoryJourneyAssignmentStore finds what it saved", () => {
  const store = newMemoryJourneyAssignmentStore();
  const item = newJourneyAssignment("code-462", "title-913");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
