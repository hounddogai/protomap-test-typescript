import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyReputationAssignmentStore } from "./legacy-reputation-assignment-store.js";
import { newLegacyReputationAssignment } from "./legacy-reputation-assignment.js";

test("MemoryLegacyReputationAssignmentStore finds what it saved", () => {
  const store = newMemoryLegacyReputationAssignmentStore();
  const item = newLegacyReputationAssignment("code-531", "label-802");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
