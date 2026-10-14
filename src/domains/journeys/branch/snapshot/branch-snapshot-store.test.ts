import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchSnapshotStore } from "./branch-snapshot-store.js";
import { newBranchSnapshot } from "./branch-snapshot.js";

test("MemoryBranchSnapshotStore finds what it saved", () => {
  const store = newMemoryBranchSnapshotStore();
  const item = newBranchSnapshot("code-279", "label-367");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
