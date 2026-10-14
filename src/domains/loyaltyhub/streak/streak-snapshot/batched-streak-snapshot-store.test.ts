import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedStreakSnapshotStore } from "./batched-streak-snapshot-store.js";
import { newBatchedStreakSnapshot } from "./batched-streak-snapshot.js";

test("MemoryBatchedStreakSnapshotStore finds what it saved", () => {
  const store = newMemoryBatchedStreakSnapshotStore();
  const item = newBatchedStreakSnapshot("code-709", "title-390");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
