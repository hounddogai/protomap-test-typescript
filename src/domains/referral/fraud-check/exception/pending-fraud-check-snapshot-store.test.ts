import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingFraudCheckSnapshotStore } from "./pending-fraud-check-snapshot-store.js";
import { newPendingFraudCheckSnapshot } from "./pending-fraud-check-snapshot.js";

test("MemoryPendingFraudCheckSnapshotStore finds what it saved", () => {
  const store = newMemoryPendingFraudCheckSnapshotStore();
  const item = newPendingFraudCheckSnapshot("code-833", "label-355");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
