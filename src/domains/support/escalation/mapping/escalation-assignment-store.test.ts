import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationAssignmentStore } from "./escalation-assignment-store.js";
import { newEscalationAssignment } from "./escalation-assignment.js";

test("MemoryEscalationAssignmentStore finds what it saved", () => {
  const store = newMemoryEscalationAssignmentStore();
  const item = newEscalationAssignment("code-775", "title-273");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
