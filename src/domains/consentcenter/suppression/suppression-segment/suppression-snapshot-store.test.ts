import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionSnapshotStore } from "./suppression-snapshot-store.js";
import { newSuppressionSnapshot } from "./suppression-snapshot.js";

test("MemorySuppressionSnapshotStore finds what it saved", () => {
  const store = newMemorySuppressionSnapshotStore();
  const item = newSuppressionSnapshot("code-161", "label-543");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
