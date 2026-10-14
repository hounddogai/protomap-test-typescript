import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedFunnelAssignmentStore } from "./batched-funnel-assignment-store.js";
import { newBatchedFunnelAssignment } from "./batched-funnel-assignment.js";

test("MemoryBatchedFunnelAssignmentStore finds what it saved", () => {
  const store = newMemoryBatchedFunnelAssignmentStore();
  const item = newBatchedFunnelAssignment("code-778", "title-707");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
