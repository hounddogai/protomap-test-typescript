import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationSnapshotStore } from "./reputation-snapshot-store.js";
import { newReputationSnapshot } from "./reputation-snapshot.js";

test("MemoryReputationSnapshotStore finds what it saved", () => {
  const store = newMemoryReputationSnapshotStore();
  const item = newReputationSnapshot("code-673", "title-83");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
