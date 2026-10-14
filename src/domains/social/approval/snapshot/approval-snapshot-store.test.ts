import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalSnapshotStore } from "./approval-snapshot-store.js";
import { newApprovalSnapshot } from "./approval-snapshot.js";

test("MemoryApprovalSnapshotStore finds what it saved", () => {
  const store = newMemoryApprovalSnapshotStore();
  const item = newApprovalSnapshot("code-648", "name-243");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
