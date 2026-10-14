import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryApprovalSnapshotStore } from "./primary-approval-snapshot-store.js";
import { newPrimaryApprovalSnapshot } from "./primary-approval-snapshot.js";

test("MemoryPrimaryApprovalSnapshotStore finds what it saved", () => {
  const store = newMemoryPrimaryApprovalSnapshotStore();
  const item = newPrimaryApprovalSnapshot("code-207", "title-304");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
