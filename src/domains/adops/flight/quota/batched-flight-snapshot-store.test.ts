import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedFlightSnapshotStore } from "./batched-flight-snapshot-store.js";
import { newBatchedFlightSnapshot } from "./batched-flight-snapshot.js";

test("MemoryBatchedFlightSnapshotStore finds what it saved", () => {
  const store = newMemoryBatchedFlightSnapshotStore();
  const item = newBatchedFlightSnapshot("code-424", "name-530");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
