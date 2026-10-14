import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelAssignmentStore } from "./funnel-assignment-store.js";
import { newFunnelAssignment } from "./funnel-assignment.js";

test("MemoryFunnelAssignmentStore finds what it saved", () => {
  const store = newMemoryFunnelAssignmentStore();
  const item = newFunnelAssignment("code-560", "title-610");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
